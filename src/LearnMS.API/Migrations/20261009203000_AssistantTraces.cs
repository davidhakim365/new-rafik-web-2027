using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261009203000_AssistantTraces")]
public partial class AssistantTraces : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "AssistantTraces" (
                "Id" uuid NOT NULL,
                "ActorId" uuid NOT NULL,
                "ActorRole" character varying(32) NOT NULL,
                "ActorName" character varying(256) NOT NULL,
                "Action" character varying(256) NOT NULL,
                "Detail" character varying(500),
                "Method" character varying(16) NOT NULL,
                "Path" character varying(512) NOT NULL,
                "CourseId" uuid,
                "CourseTitle" character varying(256),
                "LectureId" uuid,
                "LectureTitle" character varying(256),
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_AssistantTraces" PRIMARY KEY ("Id")
            );

            CREATE INDEX IF NOT EXISTS "IX_AssistantTraces_CreatedAt" ON "AssistantTraces" ("CreatedAt");
            CREATE INDEX IF NOT EXISTS "IX_AssistantTraces_ActorId" ON "AssistantTraces" ("ActorId");
            CREATE INDEX IF NOT EXISTS "IX_AssistantTraces_CourseId" ON "AssistantTraces" ("CourseId");
            CREATE INDEX IF NOT EXISTS "IX_AssistantTraces_LectureId" ON "AssistantTraces" ("LectureId");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "AssistantTraces";
            """);
    }
}
