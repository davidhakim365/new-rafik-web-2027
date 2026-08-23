namespace LearnMS.API.ThirdParties.GoogleForms;

public static class GoogleFormsDependencyInjection
{
    public static IServiceCollection RegisterGoogleFormsService(
        this IServiceCollection services,
        IConfiguration cfg
    )
    {
        services.Configure<GoogleFormsConfig>(cfg.GetSection(GoogleFormsConfig.Section));
        services.PostConfigure<GoogleFormsConfig>(ApplyDriveEnvironmentOverrides);
        services.AddSingleton<GoogleDriveSettingsStore>();
        services.AddSingleton<IGoogleFormsService, GoogleFormsService>();
        return services;
    }

    private static void ApplyDriveEnvironmentOverrides(GoogleFormsConfig config)
    {
        static string? Env(params string[] keys) =>
            keys.Select(Environment.GetEnvironmentVariable)
                .FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

        static string? First(params string?[] values) =>
            values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v) && v != "*");

        config.DriveClientId = First(
            config.DriveClientId,
            Env("GoogleForms__DriveClientId", "GoogleAPIs__DriveClientId", "DRIVE_CLIENT_ID"));
        config.DriveClientSecret = First(
            config.DriveClientSecret,
            Env("GoogleForms__DriveClientSecret", "GoogleAPIs__DriveClientSecret", "DRIVE_CLIENT_SECRET"));
        config.DriveRedirectUri = First(
            config.DriveRedirectUri,
            Env("GoogleForms__DriveRedirectUri", "GoogleAPIs__DriveRedirectUri", "DRIVE_REDIRECT_URI"));
        config.SharedDriveId = First(
            config.SharedDriveId,
            Env("GoogleForms__SharedDriveId", "GoogleAPIs__SharedDriveId", "DRIVE_SHARED_DRIVE_ID"));
        config.DriveRefreshToken = First(
            config.DriveRefreshToken,
            Env("GoogleForms__DriveRefreshToken", "GoogleAPIs__DriveRefreshToken", "DRIVE_REFRESH_TOKEN"));
    }
}
