using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260803070000_StudentRegistrationSettings")]
public partial class StudentRegistrationSettings : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "StudentRegistrationSettings" (
                "Id" integer NOT NULL,
                "IsSignupEnabled" boolean NOT NULL DEFAULT TRUE,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_StudentRegistrationSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "StudentRegistrationSettings" ("Id", "IsSignupEnabled", "UpdatedAt")
            SELECT 1, TRUE, TIMESTAMPTZ '2026-08-03 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "StudentRegistrationSettings" WHERE "Id" = 1
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "StudentRegistrationSettings";
            """);
    }
}
