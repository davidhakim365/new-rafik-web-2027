using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260811210000_StudentIsBlocked")]
public partial class StudentIsBlocked : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Students"
            ADD COLUMN IF NOT EXISTS "IsBlocked" boolean NOT NULL DEFAULT FALSE;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Students"
            DROP COLUMN IF EXISTS "IsBlocked";
            """);
    }
}
