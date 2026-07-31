using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260731140000_ChooseHomeworkPrefillEntries")]
public partial class ChooseHomeworkPrefillEntries : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "ChooseHomeworkStudentIdEntryId" text NULL;
            ALTER TABLE "Lectures" ADD COLUMN IF NOT EXISTS "ChooseHomeworkNameEntryId" text NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "ChooseHomeworkStudentIdEntryId";
            ALTER TABLE "Lectures" DROP COLUMN IF EXISTS "ChooseHomeworkNameEntryId";
            """);
    }
}
