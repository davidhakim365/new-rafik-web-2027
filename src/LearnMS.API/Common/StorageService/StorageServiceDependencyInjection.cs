using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.StorageService;

public static class StorageServiceDependencyInjection
{
    public static IServiceCollection AddStorageService(this IServiceCollection services, IConfiguration cfg)
    {
        services.Configure<StorageConfig>(cfg.GetSection(StorageConfig.Section));
        services.AddSingleton<StorageService>();
        return services;
    }


}