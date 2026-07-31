using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260731120000_LectureEnrollmentIsFromAttendance")]
public partial class LectureEnrollmentIsFromAttendance : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureEnrollment"
            ADD COLUMN IF NOT EXISTS "IsFromAttendance" boolean NOT NULL DEFAULT false;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureEnrollment"
            DROP COLUMN IF EXISTS "IsFromAttendance";
            """);
    }
}
