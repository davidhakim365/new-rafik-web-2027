using LearnMS.API;
using LearnMS.API.Features;
using Microsoft.AspNetCore.Http.Features;
using Serilog;

LoadDotEnv(
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env")
);

// Add services to the container.
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = null;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = long.MaxValue;
});
builder.Services.RegisterApplicationServices(builder.Configuration);
builder.Host.UseSerilog((context, configuration) => { configuration.ReadFrom.Configuration(context.Configuration); });
var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseApplicationRequestPipelines();
await app.InitializeAsync();
app.Run();

static void LoadDotEnv(params string[] paths)
{
    foreach (var path in paths)
    {
        var fullPath = Path.GetFullPath(path);
        if (!File.Exists(fullPath))
            continue;

        foreach (var raw in File.ReadAllLines(fullPath))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#') || !line.Contains('='))
                continue;

            var separator = line.IndexOf('=');
            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"').Trim('\'');
            if (string.IsNullOrWhiteSpace(key) || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                continue;

            Environment.SetEnvironmentVariable(key, value);
        }
    }
}