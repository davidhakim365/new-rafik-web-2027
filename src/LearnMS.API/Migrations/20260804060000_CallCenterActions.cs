using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260804060000_CallCenterActions")]
public partial class CallCenterActions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "CallCenterActions" (
                "Id" uuid NOT NULL,
                "LectureId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "ActorId" uuid NOT NULL,
                "ActionType" character varying(32) NOT NULL,
                "Comment" character varying(4000) NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_CallCenterActions" PRIMARY KEY ("Id")
            );

            CREATE INDEX IF NOT EXISTS "IX_CallCenterActions_LectureId_StudentId_CreatedAt"
                ON "CallCenterActions" ("LectureId", "StudentId", "CreatedAt");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "CallCenterActions";
            """);
    }
}
