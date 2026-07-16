using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Features.Administration;
using LearnMS.API.Features.Administration.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Features;

public static class ApplicationInitialization
{
    public static async Task InitializeAsync(this WebApplication app)
    {
        var scope = app.Services.CreateAsyncScope();

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
            Console.WriteLine("Database migrations applied");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database migration failed: {ex.Message}");
            throw;
        }

        var administrationService = scope.ServiceProvider.GetRequiredService<IAdministrationService>();
        var administrationConfig = scope.ServiceProvider.GetRequiredService<IOptions<AdministrationConfig>>();

        foreach (var teacher in administrationConfig.Value.Teachers ?? [])
        {
            try
            {
                await administrationService.ExecuteAsync(new CreateTeacherCommand
                {
                    Email = teacher.Email,
                    Password = teacher.Password
                });
                Console.WriteLine($"Teacher {teacher.Email} created");
            }
            catch (ApiException ex)
            {
                if (ex.Error == AdministrationErrors.EmailAlreadyRegistered)
                    Console.WriteLine($"Teacher {teacher.Email} already exists");
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        foreach (var assistant in administrationConfig.Value.Assistants ?? [])
        {
            try
            {
                await administrationService.ExecuteAsync(new CreateAssistantCommand
                {
                    Email = assistant.Email,
                    Password = assistant.Password
                });
                Console.WriteLine($"Assistant {assistant.Email} created");
            }
            catch (ApiException ex)
            {
                if (ex.Error == AdministrationErrors.EmailAlreadyRegistered)
                    Console.WriteLine($"Assistant {assistant.Email} already exists");
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
    }
}
