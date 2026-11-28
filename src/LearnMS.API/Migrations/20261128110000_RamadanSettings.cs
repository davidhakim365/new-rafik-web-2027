using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261128110000_RamadanSettings")]
public partial class RamadanSettingsMigration : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "RamadanSettings" (
                "Id" integer NOT NULL,
                "Enabled" boolean NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_RamadanSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "RamadanSettings" ("Id", "Enabled", "UpdatedAt")
            SELECT 1, FALSE, TIMESTAMPTZ '2026-11-28 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "RamadanSettings" WHERE "Id" = 1
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "RamadanSettings";
            """);
    }
}
