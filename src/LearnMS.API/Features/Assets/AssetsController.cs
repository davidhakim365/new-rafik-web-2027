using LearnMS.API.Common;
using LearnMS.API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Assets;

[ApiController]
[Route("api/assets")]
public sealed class AssetsController(IAssetsService assetsService) : ControllerBase
{
    [HttpGet]
    public async Task<ApiWrapper.Success<PageList<Asset>>> GetAssets(int page, int pageSize, string? search)
    {
        var result = await assetsService.QueryAsync(new GetAssetsQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search
        });

        return new()
        {
            Data = result,
            Message = result.Items.Count() > 0 ? "Successfully retrieved assets" : "No PDFs found"
        };
    }

    [HttpPost("delete")]
    public async Task<ApiWrapper.Success<object?>> DeleteAsset([FromBody] List<string>? filesIds)
    {
        filesIds ??= new List<string> { };

        await assetsService.ExecuteAsync(new DeleteAssetCommand
        {
            FilesIds = filesIds
        });

        return new()
        {
            Message = "Assets deleted successfully"
        };
    }

    [HttpGet("{fileId}")]
    public async Task GetAsset(string fileId)
    {
        await assetsService.QueryAsync(new GetAssetQuery
        {
            FileId = fileId,
            Response = HttpContext.Response
        });
    }


}