using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261024120000_PaymentSettings")]
public partial class PaymentSettingsMigration : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "PaymentSettings" (
                "Id" integer NOT NULL,
                "InstapayNumber" character varying(64) NULL,
                "WalletNumber" character varying(64) NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_PaymentSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "PaymentSettings" ("Id", "InstapayNumber", "WalletNumber", "UpdatedAt")
            SELECT 1, NULL, NULL, TIMESTAMPTZ '2026-10-24 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentSettings" WHERE "Id" = 1
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "PaymentSettings";
            """);
    }
}
