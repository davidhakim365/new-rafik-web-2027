using LearnMS.API.Common.StorageService;
using LearnMS.API.ThirdParties.VdoCipher;
using Serilog;

namespace LearnMS.API;

public static class ApplicationRequestPipelines
{
    public static void UseApplicationRequestPipelines(this WebApplication app)
    {
        app.UseSerilogRequestLogging();
        app.UseHttpsRedirection();
        app.UseExceptionHandler(opt => { });
        UseSwaggerIfDevelopment(app);
        app.UseAssets();
        app.MapVideoUploadEndpoints();
        UseAuth(app);
        app.MapControllers();
        app.UseStorageService();
        MapSpaClient(app);
    }

    private static void UseAuth(WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
    }

    private static void MapSpaClient(WebApplication app)
    {
        app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments("/api"), x =>
        {
            x.UseSpaStaticFiles();
            x.UseStaticFiles();
            x.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";
                if (app.Environment.IsDevelopment())
                {
                    spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
                }
            });
        });
    }

    private static void UseSwaggerIfDevelopment(WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
    }
}