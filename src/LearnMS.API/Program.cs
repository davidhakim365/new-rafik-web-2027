using LearnMS.API;
using LearnMS.API.Features;
using Serilog;

// Add services to the container.
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterApplicationServices(builder.Configuration);
builder.Host.UseSerilog((context, configuration) => { configuration.ReadFrom.Configuration(context.Configuration); });
var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseApplicationRequestPipelines();
await app.InitializeAsync();
app.Run();