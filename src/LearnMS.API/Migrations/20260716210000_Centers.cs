using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260716210000_Centers")]
public partial class Centers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "Center" (
                "Id" uuid NOT NULL,
                "Name" text NOT NULL,
                "IsActive" boolean NOT NULL DEFAULT TRUE,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                CONSTRAINT "PK_Center" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Center_Name" ON "Center" ("Name");

            ALTER TABLE "LectureAttendance"
                ADD COLUMN IF NOT EXISTS "CenterId" uuid NULL;

            ALTER TABLE "LectureAttendance"
                DROP CONSTRAINT IF EXISTS "FK_LectureAttendance_Center_CenterId";

            ALTER TABLE "LectureAttendance"
                ADD CONSTRAINT "FK_LectureAttendance_Center_CenterId"
                FOREIGN KEY ("CenterId") REFERENCES "Center" ("Id") ON DELETE SET NULL;

            INSERT INTO "Center" ("Id", "Name", "IsActive", "CreatedAt")
            VALUES
                ('a1111111-1111-1111-1111-111111111101', 'Alpha center', TRUE, NOW()),
                ('a1111111-1111-1111-1111-111111111102', 'Hanii Pierre center', TRUE, NOW())
            ON CONFLICT ("Id") DO NOTHING;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureAttendance" DROP CONSTRAINT IF EXISTS "FK_LectureAttendance_Center_CenterId";
            ALTER TABLE "LectureAttendance" DROP COLUMN IF EXISTS "CenterId";
            DROP TABLE IF EXISTS "Center";
            """);
    }
}
