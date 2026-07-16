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
            // Do NOT call Database.MigrateAsync() here: many existing DBs have tables
            // without a matching __EFMigrationsHistory, which causes "relation already exists".
            await EnsureQuizExamRebuildSchemaAsync(db);
            Console.WriteLine("Quiz/Exam schema patch applied");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database schema patch failed: {ex.Message}");
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

    /// <summary>
    /// Idempotent patch for the quiz/exam rebuild columns/tables.
    /// Safe on databases that already have the full schema.
    /// </summary>
    private static async Task EnsureQuizExamRebuildSchemaAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE "Quiz"
                ADD COLUMN IF NOT EXISTS "ExpiryMinutes" integer NOT NULL DEFAULT 0;

            ALTER TABLE "Question"
                ADD COLUMN IF NOT EXISTS "SourceTitle" text NULL;

            ALTER TABLE "Question"
                ADD COLUMN IF NOT EXISTS "SourceIndex" integer NULL;

            CREATE TABLE IF NOT EXISTS "QuizAttempt" (
                "QuizId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "StartedAt" timestamp with time zone NOT NULL,
                "ExpiresAt" timestamp with time zone NULL,
                CONSTRAINT "PK_QuizAttempt" PRIMARY KEY ("QuizId", "StudentId"),
                CONSTRAINT "FK_QuizAttempt_Quiz_QuizId" FOREIGN KEY ("QuizId") REFERENCES "Quiz" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_QuizAttempt_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );
            """);
    }
}
