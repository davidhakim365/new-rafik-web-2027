-- Apply Quiz/Exam rebuild schema (safe to re-run)
-- Fixes: column q.ExpiryMinutes does not exist

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

-- Record migration so EF does not try to re-apply it
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260716150000_QuizExamRebuild', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260716150000_QuizExamRebuild'
);
