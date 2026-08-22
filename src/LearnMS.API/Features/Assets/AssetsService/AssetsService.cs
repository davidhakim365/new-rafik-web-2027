using System.Text;
using LearnMS.API.Common;
using LearnMS.API.Common.StorageService;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using tusdotnet.Stores;

namespace LearnMS.API.Features.Assets;

public sealed class AssetsService(AppDbContext db, IOptions<StorageConfig> options) : IAssetsService
{
    public TusDiskStore store = new(options.Value.AssetsDirectory, deletePartialFilesOnConcat: true);

    public async Task ExecuteAsync(CreateAssetCommand command, CancellationToken ct = default)
    {
        var metadata = await command.File.GetMetadataAsync(ct);

        var name = metadata["filename"].GetString(Encoding.UTF8);

        if (name is null)
        {
            await store.DeleteFileAsync(command.File.Id, ct);
            throw new ApiException(AssetsErrors.FileWithoutName);
        }

        var type = metadata["type"].GetString(Encoding.UTF8) switch
        {
            "image/png" => AssetType.Image,
            "image/jpeg" => AssetType.Image,
            "application/pdf" => AssetType.Pdf,
            _ => AssetType.Unknown,
        };


        var asset = new Asset
        {
            Id = command.File.Id,
            Name = name,
            Type = type
        };

        await db.AddAsync(asset, ct);

        await db.SaveChangesAsync(ct);
    }

    public async Task ExecuteAsync(DeleteAssetCommand command, CancellationToken ct = default)
    {
        var assets = await db.Set<Asset>()
            .Where(x => command.FilesIds.Contains(x.Id))
            .ToListAsync(ct);

        foreach (var asset in assets)
        {
            var hostedLocally = string.IsNullOrEmpty(asset.Url) ||
                !asset.Url.StartsWith("http", StringComparison.OrdinalIgnoreCase);

            if (hostedLocally)
            {
                try
                {
                    await store.DeleteFileAsync(asset.Id, ct);
                }
                catch
                {
                    // Disk file may already be missing
                }

                var uploadedPdf = GetUploadedPdfPath(asset.Id);
                if (File.Exists(uploadedPdf))
                {
                    try
                    {
                        File.Delete(uploadedPdf);
                    }
                    catch
                    {
                        // Disk file may already be missing
                    }
                }
            }
        }

        db.RemoveRange(assets);
        await db.SaveChangesAsync(ct);
    }

    public async Task QueryAsync(GetAssetQuery query, CancellationToken ct = default)
    {
        var asset = await db.Set<Asset>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.FileId, ct);

        if (asset is not null &&
            !string.IsNullOrEmpty(asset.Url) &&
            Uri.TryCreate(asset.Url, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            query.Response.Redirect(PdfViewerUrls.ToPublicViewerUrl(asset.Url));
            return;
        }

        var uploadedPdf = GetUploadedPdfPath(query.FileId);
        if (File.Exists(uploadedPdf))
        {
            await WriteInlineFileAsync(
                query.Response,
                uploadedPdf,
                asset?.Name ?? "document.pdf",
                "application/pdf",
                ct);
            return;
        }

        var file = await store.GetFileAsync(query.FileId, ct) ??
        throw new ApiException(AssetsErrors.NotFound);


        var metadata = await file.GetMetadataAsync(ct);

        var contentType = metadata.ContainsKey("contentType")
            ? metadata["contentType"].GetString(Encoding.UTF8)
            : metadata.ContainsKey("type")
                ? metadata["type"].GetString(Encoding.UTF8)
                : null;

        if (string.IsNullOrWhiteSpace(contentType))
            contentType = asset?.Type == AssetType.Pdf ? "application/pdf" : "application/octet-stream";

        query.Response.ContentType = contentType;

        var downloadName = asset?.Name;
        if (metadata.ContainsKey("name"))
            downloadName = metadata["name"].GetString(Encoding.UTF8);
        else if (metadata.ContainsKey("filename"))
            downloadName = metadata["filename"].GetString(Encoding.UTF8);

        if (!string.IsNullOrWhiteSpace(downloadName))
        {
            if (contentType == "application/pdf" &&
                !downloadName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                downloadName += ".pdf";

            query.Response.Headers.ContentDisposition = $"inline; filename=\"{downloadName}\"";
        }

        using (var fileStream = await file.GetContentAsync(ct))
        {
            await fileStream.CopyToAsync(query.Response.Body, ct);
        }
    }

    public async Task<PageList<Asset>> QueryAsync(GetAssetsQuery query)
    {
        var assets = db.Set<Asset>().AsNoTracking().OrderByDescending(x => x.CreatedAt);


        if (string.IsNullOrEmpty(query.Search) is false)
        {
            assets = assets
                .Where(x =>
                    x.Name.Contains(query.Search) ||
                    (x.LectureName != null && x.LectureName.Contains(query.Search)))
                .OrderByDescending(x => x.CreatedAt);
        }

        return await PageList<Asset>.CreateAsync(assets, query.Page, query.PageSize);
    }

    private string GetUploadedPdfPath(string assetId) =>
        Path.Combine(options.Value.AssetsDirectory, "pdfs", $"{assetId}.pdf");

    private static async Task WriteInlineFileAsync(
        HttpResponse response,
        string path,
        string name,
        string contentType,
        CancellationToken ct)
    {
        response.ContentType = contentType;
        var fileName = Path.GetFileName(name);
        if (string.IsNullOrWhiteSpace(fileName))
            fileName = "document.pdf";
        if (contentType == "application/pdf" &&
            !fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            fileName += ".pdf";

        response.Headers.ContentDisposition = $"inline; filename=\"{fileName}\"";
        await response.SendFileAsync(path, cancellationToken: ct);
    }
}
