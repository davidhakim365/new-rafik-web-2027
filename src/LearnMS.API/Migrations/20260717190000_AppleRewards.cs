using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260717190000_AppleRewards")]
public partial class AppleRewards : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Students" ADD COLUMN IF NOT EXISTS "Apples" integer NOT NULL DEFAULT 0;

            ALTER TABLE "Assistants" ADD COLUMN IF NOT EXISTS "Apples" integer NOT NULL DEFAULT 0;
            ALTER TABLE "Assistants" ADD COLUMN IF NOT EXISTS "SessionsAttended" integer NOT NULL DEFAULT 0;
            ALTER TABLE "Assistants" ADD COLUMN IF NOT EXISTS "Code" text NOT NULL DEFAULT '';

            UPDATE "Assistants"
            SET "Code" = LPAD((200000 + (ABS(('x' || SUBSTRING(REPLACE("Id"::text, '-', ''), 1, 8))::bit(32)::int) % 800000))::text, 6, '0')
            WHERE "Code" IS NULL OR "Code" = '';

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Assistants_Code" ON "Assistants" ("Code");

            CREATE TABLE IF NOT EXISTS "StudentAppleTransactions" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "ActorId" uuid NULL,
                "Amount" integer NOT NULL,
                "Reason" text NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_StudentAppleTransactions" PRIMARY KEY ("Id")
            );

            CREATE INDEX IF NOT EXISTS "IX_StudentAppleTransactions_StudentId"
                ON "StudentAppleTransactions" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_StudentAppleTransactions_CreatedAt"
                ON "StudentAppleTransactions" ("CreatedAt");

            CREATE TABLE IF NOT EXISTS "AssistantRewardEvents" (
                "Id" uuid NOT NULL,
                "AssistantId" uuid NOT NULL,
                "ActorId" uuid NULL,
                "Type" text NOT NULL,
                "Amount" integer NOT NULL,
                "SessionsAttendedAfter" integer NULL,
                "Reason" text NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_AssistantRewardEvents" PRIMARY KEY ("Id")
            );

            CREATE INDEX IF NOT EXISTS "IX_AssistantRewardEvents_AssistantId"
                ON "AssistantRewardEvents" ("AssistantId");
            CREATE INDEX IF NOT EXISTS "IX_AssistantRewardEvents_CreatedAt"
                ON "AssistantRewardEvents" ("CreatedAt");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "StudentAppleTransactions";
            DROP TABLE IF EXISTS "AssistantRewardEvents";
            DROP INDEX IF EXISTS "IX_Assistants_Code";
            ALTER TABLE "Assistants" DROP COLUMN IF EXISTS "Code";
            ALTER TABLE "Assistants" DROP COLUMN IF EXISTS "SessionsAttended";
            ALTER TABLE "Assistants" DROP COLUMN IF EXISTS "Apples";
            ALTER TABLE "Students" DROP COLUMN IF EXISTS "Apples";
            """);
    }
}
