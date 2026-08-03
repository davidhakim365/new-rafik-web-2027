using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260803060000_StudentCodeAndPhoneUnique")]
public partial class StudentCodeAndPhoneUnique : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Students_StudentCode"
                ON "Students" ("StudentCode");

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Students_PhoneNumber"
                ON "Students" ("PhoneNumber");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS "IX_Students_StudentCode";
            DROP INDEX IF EXISTS "IX_Students_PhoneNumber";
            """);
    }
}
