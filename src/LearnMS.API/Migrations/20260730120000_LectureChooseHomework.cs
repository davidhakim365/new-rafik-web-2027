using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260730120000_LectureChooseHomework")]
public partial class LectureChooseHomework : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "ChooseHomeworkFormId" text NULL;
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "ChooseHomeworkFormUrl" text NULL;
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "ChooseHomeworkFullMark" numeric NULL;

            CREATE TABLE IF NOT EXISTS "LectureChooseHomework" (
                "LectureId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Score" numeric NOT NULL,
                CONSTRAINT "PK_LectureChooseHomework" PRIMARY KEY ("LectureId", "StudentId"),
                CONSTRAINT "FK_LectureChooseHomework_Lectures_LectureId"
                    FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_LectureChooseHomework_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "LectureChooseHomework";
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "ChooseHomeworkFormId";
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "ChooseHomeworkFormUrl";
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "ChooseHomeworkFullMark";
            """);
    }
}
