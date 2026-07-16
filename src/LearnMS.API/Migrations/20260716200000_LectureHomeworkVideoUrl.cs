using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260716200000_LectureHomeworkVideoUrl")]
public partial class LectureHomeworkVideoUrl : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "HomeworkVideoUrl" text NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "HomeworkVideoUrl";
            """);
    }
}
