namespace LearnMS.API.ThirdParties.GoogleForms;

public static class GoogleFormsDependencyInjection
{
    public static IServiceCollection RegisterGoogleFormsService(
        this IServiceCollection services,
        IConfiguration cfg
    )
    {
        services.Configure<GoogleFormsConfig>(cfg.GetSection(GoogleFormsConfig.Section));
        services.AddSingleton<IGoogleFormsService, GoogleFormsService>();
        return services;
    }
}
