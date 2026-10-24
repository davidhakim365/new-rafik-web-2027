using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LearnMS.API.Common;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.Cloudinary;

public sealed class CloudinaryUploadResult
{
    public required string Url { get; init; }
    public string? ThumbUrl { get; init; }
}

public interface ICloudinaryService
{
    Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct = default);
    Task<string> UploadAsync(IFormFile file, CancellationToken ct = default);
    Task<CloudinaryUploadResult> UploadWithThumbAsync(IFormFile file, CancellationToken ct = default);
    Task<CloudinaryUploadResult> UploadWithThumbAsync(Stream stream, string fileName, CancellationToken ct = default);
}

public sealed class CloudinaryService(IHttpClientFactory httpClientFactory, IOptions<CloudinaryConfig> options)
    : ICloudinaryService
{
    public async Task<string> UploadAsync(IFormFile file, CancellationToken ct = default)
    {
        var result = await UploadWithThumbAsync(file, ct);
        return result.Url;
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct = default)
    {
        var result = await UploadWithThumbAsync(stream, fileName, ct);
        return result.Url;
    }

    public async Task<CloudinaryUploadResult> UploadWithThumbAsync(IFormFile file, CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        return await UploadWithThumbAsync(stream, file.FileName, ct);
    }

    public async Task<CloudinaryUploadResult> UploadWithThumbAsync(Stream stream, string fileName, CancellationToken ct = default)
    {
        var cfg = options.Value;
        if (string.IsNullOrWhiteSpace(cfg.CloudName) ||
            string.IsNullOrWhiteSpace(cfg.ApiKey) ||
            string.IsNullOrWhiteSpace(cfg.ApiSecret))
        {
            throw new ApiException(new ApiError(
                "Cloudinary.NotConfigured",
                "Cloudinary credentials are not configured",
                StatusCodes.Status500InternalServerError));
        }

        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var folder = string.IsNullOrWhiteSpace(cfg.Folder) ? "rafik" : cfg.Folder.Trim();
        var signed = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = folder,
            ["timestamp"] = timestamp
        };
        var signature = Sign(signed, cfg.ApiSecret);

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", Path.GetFileName(fileName));
        content.Add(new StringContent(cfg.ApiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(signature), "signature");
        content.Add(new StringContent(folder), "folder");

        var client = httpClientFactory.CreateClient("Cloudinary");
        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cfg.CloudName}/image/upload";
        var response = await client.PostAsync(uploadUrl, content, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new ApiException(new ApiError(
                "Cloudinary.UploadFailed",
                ReadError(body) ?? "Failed to upload image to Cloudinary",
                StatusCodes.Status502BadGateway));
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var url = root.TryGetProperty("secure_url", out var secureUrl) ? secureUrl.GetString() : null;
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ApiException(new ApiError(
                "Cloudinary.UploadFailed",
                "Cloudinary response missing image URL",
                StatusCodes.Status502BadGateway));
        }

        return new CloudinaryUploadResult
        {
            Url = WithTransform(url, "f_auto,q_auto"),
            ThumbUrl = WithTransform(url, "c_limit,w_400,f_auto,q_auto")
        };
    }

    private static string Sign(SortedDictionary<string, string> parameters, string apiSecret)
    {
        var payload = string.Join("&", parameters.Select(pair => $"{pair.Key}={pair.Value}"));
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(payload + apiSecret));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string WithTransform(string secureUrl, string transform)
    {
        const string marker = "/image/upload/";
        var index = secureUrl.IndexOf(marker, StringComparison.Ordinal);
        if (index < 0)
            return secureUrl;
        return secureUrl.Insert(index + marker.Length, transform + "/");
    }

    private static string? ReadError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("message", out var message))
                return message.GetString();
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }
}
