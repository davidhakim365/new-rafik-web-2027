using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.StorageService;

public class StorageService(IOptions<StorageConfig> options, ILogger<StorageService> logger)
{
    public async Task<string> SaveAsync(string relPath, Stream stream, string extension, string? fileName = null)
    {
        var directory = Path.Combine(options.Value.AssetsDirectory, relPath);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            fileName = Guid.NewGuid().ToString() + extension;
        }
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
            logger.LogInformation("[StorageService] ==> created directory {@dir}", directory);
        }
        var path = Path.Combine(directory, fileName);
        using var fileStream = new FileStream(path, FileMode.Create);
        await stream.CopyToAsync(fileStream);
        logger.LogInformation("[StorageService] ==> saved file {@path}", path);
        return Path.Combine(StorageConfig.RequestPath, relPath, fileName);
    }

    public void Delete(string filePath)
    {
        var absPath = Path.Combine(options.Value.AssetsDirectory, filePath.Replace(StorageConfig.RequestPath + "/", ""));
        if (File.Exists(absPath))
        {
            File.Delete(absPath);
            logger.LogInformation("[StorageService] ==> deleted file {@path}", absPath);
        }
    }
}