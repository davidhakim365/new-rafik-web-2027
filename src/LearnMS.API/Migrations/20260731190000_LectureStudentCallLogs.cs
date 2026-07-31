using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260731190000_LectureStudentCallLogs")]
public partial class LectureStudentCallLogs : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "LectureStudentCallLogs" (
                "LectureId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Comment" text NULL,
                "Called" boolean NOT NULL DEFAULT false,
                "CalledAt" timestamp with time zone NULL,
                "UpdatedBy" uuid NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_LectureStudentCallLogs" PRIMARY KEY ("LectureId", "StudentId"),
                CONSTRAINT "FK_LectureStudentCallLogs_Lectures_LectureId"
                    FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_LectureStudentCallLogs_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "LectureStudentCallLogs";
            """);
    }
}
