using LearnMS.API.Entities;
using tusdotnet.Interfaces;
using tusdotnet.Stores;

namespace LearnMS.API.Features.Assets;

public interface IAssetsService
{
    public Task ExecuteAsync(CreateAssetCommand command, CancellationToken ct = default);
    public Task ExecuteAsync(DeleteAssetCommand command, CancellationToken ct = default);

    public Task QueryAsync(GetAssetQuery query, CancellationToken ct = default);
    public Task<PageList<Asset>> QueryAsync(GetAssetsQuery query);
}

public class GetAssetsQuery
{
    public int Page = 1;
    public int PageSize = 10;
    public string? Search;
}

public class GetAssetQuery
{
    public required string FileId;
    public required HttpResponse Response;
}

public class DeleteAssetCommand
{
    public required List<string> FilesIds;
}

public class CreateAssetCommand
{
    public required ITusFile File;
}