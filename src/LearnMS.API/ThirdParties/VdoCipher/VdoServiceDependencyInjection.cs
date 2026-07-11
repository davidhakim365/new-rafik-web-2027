using Microsoft.Extensions.Options;

namespace LearnMS.API.ThirdParties.VdoCipher;

public static class VdoServiceDependencyInjection
{
    public static IServiceCollection RegisterVdoService(this IServiceCollection services, IConfiguration cfg)
    {
        services.Configure<VdoConfig>(cfg.GetSection(VdoConfig.Section));
        services.AddHttpClient<VdoService>((serviceCollection, client) =>
        {
            var secret = serviceCollection.GetRequiredService<IOptions<VdoConfig>>().Value.ApiSecret;
            client.BaseAddress = new Uri("https://www.vdocipher.com/api/");
            client.DefaultRequestHeaders.Add("Authorization", "Apisecret " + secret);
        });
        services.AddSingleton<VdoService>();
        return services;
    }

}