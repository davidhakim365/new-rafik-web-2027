using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260728190000_RewardSystemSettings")]
public partial class AddRewardSystemSettings : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "RewardSystemSettings" (
                "Id" integer NOT NULL,
                "BaseSessionValue" integer NOT NULL,
                "SessionsPerMilestone" integer NOT NULL,
                "SessionBonusIncrement" integer NOT NULL,
                "MaxSessionValue" integer NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_RewardSystemSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "RewardSystemSettings" (
                "Id",
                "BaseSessionValue",
                "SessionsPerMilestone",
                "SessionBonusIncrement",
                "MaxSessionValue",
                "UpdatedAt"
            )
            SELECT 1, 150, 20, 20, 200, TIMESTAMPTZ '2026-07-28 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "RewardSystemSettings" WHERE "Id" = 1
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "RewardSystemSettings";
            """);
    }
}
