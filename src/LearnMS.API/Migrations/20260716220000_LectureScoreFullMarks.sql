ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "HomeworkFullMark" numeric NULL;
ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "QuizFullMark" numeric NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260716220000_LectureScoreFullMarks', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260716220000_LectureScoreFullMarks'
);
