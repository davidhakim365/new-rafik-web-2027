using System.Net.Http.Headers;
using System.Text.Json;
using LearnMS.API.Common;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.ImgBb;

public interface IImgBbService
{
    Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct = default);
    Task<string> UploadAsync(IFormFile file, CancellationToken ct = default);
}

public sealed class ImgBbService(IHttpClientFactory httpClientFactory, IOptions<ImgBbConfig> options) : IImgBbService
{
    private const string UploadUrl = "https://api.imgbb.com/1/upload";

    public async Task<string> UploadAsync(IFormFile file, CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        return await UploadAsync(stream, file.FileName, ct);
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct = default)
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
        if (data.TryGetProperty("display_url", out var displayUrl))
            return displayUrl.GetString()!;
        if (data.TryGetProperty("url", out var url))
            return url.GetString()!;

        throw new ApiException(new ApiError("ImgBb.UploadFailed", "ImgBB response missing image URL",
            StatusCodes.Status502BadGateway));
    }
}
