using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260904180000_LectureQuizAnswerAssets")]
public partial class LectureQuizAnswerAssets : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "LectureQuizAnswerAsset" (
                "AssetId" text NOT NULL,
                "LectureId" uuid NOT NULL,
                CONSTRAINT "PK_LectureQuizAnswerAsset" PRIMARY KEY ("AssetId", "LectureId"),
                CONSTRAINT "FK_LectureQuizAnswerAsset_Asset_AssetId"
                    FOREIGN KEY ("AssetId") REFERENCES "Asset" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_LectureQuizAnswerAsset_Lectures_LectureId"
                    FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "LectureQuizAnswerAsset";
            """);
    }
}
