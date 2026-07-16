using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260716220000_LectureScoreFullMarks")]
public partial class LectureScoreFullMarks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "HomeworkFullMark" numeric NULL;
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "QuizFullMark" numeric NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "HomeworkFullMark";
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "QuizFullMark";
            """);
    }
}
