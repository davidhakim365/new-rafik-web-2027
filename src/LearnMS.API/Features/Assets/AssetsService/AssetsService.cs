using System.Text;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Assets;
using Microsoft.EntityFrameworkCore;
using tusdotnet.Stores;
using LearnMS.API.Common.StorageService;
using Microsoft.Extensions.Options;



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

        List<string> deletedFiles = [];


        foreach (var fileId in command.FilesIds)
        {
            try
            {
                await store.DeleteFileAsync(fileId, ct);
                deletedFiles.Add(fileId);
            }
            catch
            {

            }
        }

        db.RemoveRange(db.Set<Asset>().Where(x => deletedFiles.Contains(x.Id)));

        await db.SaveChangesAsync();
    }

    public async Task QueryAsync(GetAssetQuery query, CancellationToken ct = default)
    {
        var file = await store.GetFileAsync(query.FileId, ct) ??
        throw new ApiException(AssetsErrors.NotFound);


        var metadata = await file.GetMetadataAsync(ct);

        query.Response.ContentType = metadata.ContainsKey("contentType")
            ? metadata["contentType"].GetString(System.Text.Encoding.UTF8)
            : "application/octet-stream";

        if (metadata.ContainsKey("name"))
        {
            var name = metadata["name"].GetString(System.Text.Encoding.UTF8);
            query.Response.Headers.Append("Content-Disposition", new[] { $"attachment; filename=\"{name}\"" });
        }

        using (var fileStream = await file.GetContentAsync(ct))
        {
            await fileStream.CopyToAsync(query.Response.Body, ct);
        }
    }

    public async Task<PageList<Asset>> QueryAsync(GetAssetsQuery query)
    {
        var assets = db.Set<Asset>().AsNoTracking().OrderByDescending(x=>x.CreatedAt);


        if (string.IsNullOrEmpty(query.Search) is false)
        {
            assets = assets.Where(x => x.Name.Contains(query.Search)).OrderByDescending(x=>x.CreatedAt);
        }

        return await PageList<Asset>.CreateAsync(assets, query.Page, query.PageSize);
    }
}
