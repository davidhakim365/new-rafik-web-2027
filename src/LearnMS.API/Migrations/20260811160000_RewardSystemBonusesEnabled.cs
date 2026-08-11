using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260811160000_RewardSystemBonusesEnabled")]
public partial class RewardSystemBonusesEnabled : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "RewardSystemSettings"
            ADD COLUMN IF NOT EXISTS "BonusesEnabled" boolean NOT NULL DEFAULT TRUE;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "RewardSystemSettings"
            DROP COLUMN IF EXISTS "BonusesEnabled";
            """);
    }
}
