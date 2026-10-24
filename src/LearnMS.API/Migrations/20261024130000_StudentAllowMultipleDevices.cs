using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261024130000_StudentAllowMultipleDevices")]
public partial class StudentAllowMultipleDevices : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Students"
            ADD COLUMN IF NOT EXISTS "AllowMultipleDevices" boolean NOT NULL DEFAULT FALSE;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Students"
            DROP COLUMN IF EXISTS "AllowMultipleDevices";
            """);
    }
}
