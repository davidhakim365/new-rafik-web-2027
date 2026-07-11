using LearnMS.API.Features.Administration;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Courses.Lectures;
using LearnMS.API.Features.Courses.Lectures.Lessons;
using LearnMS.API.Features.CreditCodes;
using LearnMS.API.Features.Profile;
using LearnMS.API.Features.Questions;
using LearnMS.API.Features.Students;
using LearnMS.API.Security.PasswordHasher;
using LearnMS.API.ThirdParties;

namespace LearnMS.API.Features;

public static class FeaturesDependencyInjection
{
    public static IServiceCollection RegisterFeaturesServices(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<ICodeGenerator, CodeGenerator>();
        services.AddScoped<ICreditCodesService, CreditCodesService>();

        services.AddScoped<IProfileService, ProfileService>();


        // services.AddScoped<ILecturesService>();
        // services.AddScoped<ILessonsService>();
        services.AddScoped<ICoursesService, CoursesService>();
        services.AddScoped<IStudentsService, StudentsService>();
        
    services.Configure<AdministrationConfig>(cfg.GetSection(AdministrationConfig.Section));
        services.AddScoped<IAdministrationService, AdministrationService>();
        services.AddScoped<IQuestionsService, QuestionsService>();

        services.AddAssets();

        return services;
    }
}