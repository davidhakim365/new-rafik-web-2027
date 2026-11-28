using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261128100000_ChristmasSettings")]
public partial class ChristmasSettingsMigration : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "ChristmasSettings" (
                "Id" integer NOT NULL,
                "Enabled" boolean NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_ChristmasSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "ChristmasSettings" ("Id", "Enabled", "UpdatedAt")
            SELECT 1, FALSE, TIMESTAMPTZ '2026-11-28 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "ChristmasSettings" WHERE "Id" = 1
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "ChristmasSettings";
            """);
    }
}
