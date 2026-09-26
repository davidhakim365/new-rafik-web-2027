using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260926180000_StudentDiscounts")]
public partial class StudentDiscounts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "StudentDiscounts" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Percentage" numeric(5,2) NOT NULL,
                "AppliesTo" character varying(16) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_StudentDiscounts" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_StudentDiscounts_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_StudentDiscounts_StudentId" ON "StudentDiscounts" ("StudentId");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "StudentDiscounts";
            """);
    }
}
