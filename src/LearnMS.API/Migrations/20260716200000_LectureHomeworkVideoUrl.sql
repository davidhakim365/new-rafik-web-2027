-- Lecture homework YouTube video URL (safe to re-run)
-- Do NOT use `dotnet ef database update` if Init is pending.

ALTER TABLE "Lectures"
    ADD COLUMN IF NOT EXISTS "HomeworkVideoUrl" text NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260716200000_LectureHomeworkVideoUrl', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260716200000_LectureHomeworkVideoUrl'
);
