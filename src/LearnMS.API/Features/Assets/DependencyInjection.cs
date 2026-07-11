using LearnMS.API.Features.Assets;
using tusdotnet;
using tusdotnet.Stores;
using Microsoft.Extensions.Options;
using LearnMS.API.Common.StorageService;


public static class DependencyInjection
{
    public static IServiceCollection AddAssets(this IServiceCollection services)
    {
        services.AddScoped<IAssetsService, AssetsService>();
        return services;
    }


    public static WebApplication UseAssets(this WebApplication app)
    {
        app.MapTus("/api/assets", async context =>
        {
            await Task.CompletedTask;
            var scope = context.RequestServices.CreateScope();
            var filesService = scope.ServiceProvider.GetRequiredService<IAssetsService>();
            var storageCfg = scope.ServiceProvider.GetRequiredService<IOptions<StorageConfig>>().Value;

            if (Directory.Exists(storageCfg.AssetsDirectory) is false)
            {
                Directory.CreateDirectory(storageCfg.AssetsDirectory);
            }

            return new()
            {
                MaxAllowedUploadSizeInBytes = 1024 * 1024 * 50,
                Store = new TusDiskStore(storageCfg.AssetsDirectory),
                Events = new()
                {
                    OnCreateCompleteAsync = async eventContext =>
                    {
                        await filesService.ExecuteAsync(new CreateAssetCommand
                        {
                            File = await eventContext.GetFileAsync()
                        });
                    }
                }
            };
        }).AllowAnonymous();

        return app;
    }
}