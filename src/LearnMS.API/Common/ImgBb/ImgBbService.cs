using System.Text.Json;
using LearnMS.API.Common;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.ImgBb;

public sealed class ImgBbUploadResult
{
    public required string Url { get; init; }
    public string? ThumbUrl { get; init; }
}

public interface IImgBbService
{
    Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct = default);
    Task<string> UploadAsync(IFormFile file, CancellationToken ct = default);
    Task<ImgBbUploadResult> UploadWithThumbAsync(IFormFile file, CancellationToken ct = default);
    Task<ImgBbUploadResult> UploadWithThumbAsync(Stream stream, string fileName, CancellationToken ct = default);
}

public sealed class ImgBbService(IHttpClientFactory httpClientFactory, IOptions<ImgBbConfig> options) : IImgBbService
{
    private const string UploadUrl = "https://api.imgbb.com/1/upload";

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

    public async Task<ImgBbUploadResult> UploadWithThumbAsync(IFormFile file, CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        return await UploadWithThumbAsync(stream, file.FileName, ct);
    }

    public async Task<ImgBbUploadResult> UploadWithThumbAsync(Stream stream, string fileName, CancellationToken ct = default)
    {
        var apiKey = options.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ApiException(new ApiError("ImgBb.NotConfigured", "ImgBB API key is not configured",
                StatusCodes.Status500InternalServerError));

        using var content = new MultipartFormDataContent();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();
        var base64 = Convert.ToBase64String(bytes);

        content.Add(new StringContent(base64), "image");
        content.Add(new StringContent(Path.GetFileNameWithoutExtension(fileName)), "name");

        var client = httpClientFactory.CreateClient("ImgBb");
        var response = await client.PostAsync($"{UploadUrl}?key={apiKey}", content, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new ApiException(new ApiError("ImgBb.UploadFailed", "Failed to upload image to ImgBB",
                StatusCodes.Status502BadGateway));

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        if (!root.TryGetProperty("success", out var success) || !success.GetBoolean())
            throw new ApiException(new ApiError("ImgBb.UploadFailed", "ImgBB rejected the upload",
                StatusCodes.Status502BadGateway));

        var data = root.GetProperty("data");
        string? url = null;
        if (data.TryGetProperty("display_url", out var displayUrl))
            url = displayUrl.GetString();
        if (string.IsNullOrWhiteSpace(url) && data.TryGetProperty("url", out var imageUrl))
            url = imageUrl.GetString();

        if (string.IsNullOrWhiteSpace(url))
            throw new ApiException(new ApiError("ImgBb.UploadFailed", "ImgBB response missing image URL",
                StatusCodes.Status502BadGateway));

        string? thumbUrl = null;
        if (data.TryGetProperty("thumb", out var thumb) && thumb.TryGetProperty("url", out var thumbUrlEl))
            thumbUrl = thumbUrlEl.GetString();

        return new ImgBbUploadResult
        {
            Url = url,
            ThumbUrl = string.IsNullOrWhiteSpace(thumbUrl) ? null : thumbUrl
        };
    }
}
