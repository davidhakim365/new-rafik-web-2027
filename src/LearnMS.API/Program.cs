using LearnMS.API;
using LearnMS.API.Features;
using Microsoft.AspNetCore.Http.Features;
using Serilog;

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