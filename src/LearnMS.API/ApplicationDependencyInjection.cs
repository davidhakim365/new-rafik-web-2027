using System.Text.Json;
using System.Text.Json.Serialization;
using LearnMS.API.Common;
using LearnMS.API.Common.EmailService;
using LearnMS.API.Common.StorageService;
using LearnMS.API.Data;
using LearnMS.API.Features;
using LearnMS.API.Middlewares;
using LearnMS.API.Security;
using LearnMS.API.Security.JwtBearer;
using LearnMS.API.Security.PasswordHasher;
using LearnMS.API.ThirdParties.VdoCipher;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.OpenApi.Models;

namespace LearnMS.API;

public static class ApplicationDependencyInjection
{
    public static IServiceCollection RegisterApplicationServices(this IServiceCollection services, IConfiguration cfg)
    {
        RegisterSwagger(services);
        services.AddHttpContextAccessor();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        RegisterDatabase(services, cfg);
        RegisterAuth(services, cfg);
        RegisterCommonServices(services, cfg);
        services.RegisterVdoService(cfg);
        services.RegisterFeaturesServices(cfg);
        RegisterSpaClient(services);
        services.AddStorageService(cfg);
        RegisterControllers(services);
        return services;
    }

    private static void RegisterControllers(IServiceCollection services)
    {
        services.AddControllers();
        services.Configure<ApiBehaviorOptions>(opts =>
        {
            opts.InvalidModelStateResponseFactory = ApiWrapper.Failure.GenerateErrorResponse;
        });
        services.AddControllers().AddJsonOptions(opts =>
        {
            opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });
    }

    private static void RegisterSwagger(IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.EnableAnnotations(enableAnnotationsForInheritance: true, enableAnnotationsForPolymorphism: true);
            c.UseOneOfForPolymorphism();
            c.SupportNonNullableReferenceTypes();
            c.SelectSubTypesUsing(baseType =>
            {
                return baseType.Assembly.GetTypes().Where(type => type.IsSubclassOf(baseType) && !type.IsAbstract);
            });
            c.DescribeAllParametersInCamelCase();
            c.SelectDiscriminatorNameUsing((baseType) => "$type");
            c.SelectDiscriminatorValueUsing((subType) => subType.Name);
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Description = "Please enter token",
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                BearerFormat = "JWT",
                Scheme = "bearer"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new string[] { }
                }
            });
        });
        
services.AddEndpointsApiExplorer();
    }

    private static void RegisterSpaClient(IServiceCollection services)
    {
        services.AddSpaStaticFiles(x => { x.RootPath = "ClientApp"; });
    }

    private static void RegisterCommonServices(IServiceCollection services, IConfiguration cfg)
    {
        services.Configure<EmailConfig>(cfg.GetSection(EmailConfig.Section));
        services.AddSingleton<IEmailService, EmailService>();
        services.AddSingleton<StorageService>();
    }

    private static void RegisterAuth(IServiceCollection services, IConfiguration cfg)
    {
        services.Configure<JwtBearerConfig>(cfg.GetSection(JwtBearerConfig.Section));
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddScheme<JwtBearerOptions,
                CustomJwtBearerHandler>(JwtBearerDefaults.AuthenticationScheme, options => { });
        services.AddAuthorization();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
    }

    private static void RegisterDatabase(IServiceCollection services, IConfiguration cfg)
    {
        services.AddDbContext<AppDbContext>(opt =>
        {
            opt.UseNpgsql(cfg.GetConnectionString("DefaultConnection"));
            opt.ConfigureWarnings(w => w.Ignore(CoreEventId.RowLimitingOperationWithoutOrderByWarning));
        });
    }
}