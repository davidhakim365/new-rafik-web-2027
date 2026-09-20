using LearnMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Courses;

internal static class QuizSchema
{
    public static async Task EnsureAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Quiz"
                ADD COLUMN IF NOT EXISTS "ExpiryMinutes" integer NOT NULL DEFAULT 0;

            ALTER TABLE "Question"
                ADD COLUMN IF NOT EXISTS "SourceTitle" text NULL;

            ALTER TABLE "Question"
                ADD COLUMN IF NOT EXISTS "SourceIndex" integer NULL;

            ALTER TABLE "QuizQuestion"
                ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();

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
