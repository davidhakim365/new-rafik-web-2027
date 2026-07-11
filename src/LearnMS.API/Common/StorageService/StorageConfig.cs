namespace LearnMS.API.Common.StorageService;


public sealed class StorageConfig
{
    public const string Section = "Storage";
    public required string AssetsDirectory { get; init; }
    public required string TempDirectory { get; init; }
    public const string RequestPath = "/assets";
}