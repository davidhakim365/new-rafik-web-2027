using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261009190000_LectureStudentDiscounts")]
public partial class LectureStudentDiscounts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "LectureStudentDiscounts" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "LectureId" uuid NOT NULL,
                "Percentage" numeric(5,2) NOT NULL,
                "AppliesTo" character varying(16) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_LectureStudentDiscounts" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_LectureStudentDiscounts_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_LectureStudentDiscounts_Lectures_LectureId" FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_LectureStudentDiscounts_StudentId_LectureId"
                ON "LectureStudentDiscounts" ("StudentId", "LectureId");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "LectureStudentDiscounts";
            """);
    }
}
