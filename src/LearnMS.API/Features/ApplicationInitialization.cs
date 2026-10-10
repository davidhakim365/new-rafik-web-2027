using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Features.Administration;
using LearnMS.API.Features.Administration.Contracts;
using LearnMS.API.Features.AssistantTraces;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Discounts;
using LearnMS.API.Features.PaymentRequests;
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
            await PaymentRequestsService.EnsurePaymentRequestsTable(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EnsurePaymentRequestsTable failed: {ex.Message}");
        }

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await QuizSchema.EnsureAsync(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EnsureQuizSchema failed: {ex.Message}");
        }

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await DiscountsSchema.EnsureAsync(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EnsureStudentDiscounts failed: {ex.Message}");
        }

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await AssistantTraceSchema.EnsureAsync(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EnsureAssistantTraces failed: {ex.Message}");
        }

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await QueryPerformanceSchema.EnsureAsync(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EnsureQueryPerformanceIndexes failed: {ex.Message}");
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
                    FullName = string.IsNullOrWhiteSpace(assistant.FullName)
                        ? assistant.Email.Split('@')[0]
                        : assistant.FullName,
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
