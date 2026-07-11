using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Common.StorageService;

public static class StorageServiceRequestPipelines
{
    
    public static WebApplication UseStorageService(this WebApplication app)
    {
        if (app.Services.GetRequiredService<IOptions<StorageConfig>>().Value is { } cfg)
        {
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(cfg.AssetsDirectory),
                RequestPath = StorageConfig.RequestPath,
            });
        }
        return app;
    }
}