using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260909090000_LectureAttachmentsPublished")]
public partial class LectureAttachmentsPublished : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures"
            ADD COLUMN IF NOT EXISTS "AreAttachmentsPublished" boolean NOT NULL DEFAULT false;

            UPDATE "Lectures"
            SET "AreAttachmentsPublished" = "IsPublished"
            WHERE "AreAttachmentsPublished" = false;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "AreAttachmentsPublished";
            """);
    }
}
