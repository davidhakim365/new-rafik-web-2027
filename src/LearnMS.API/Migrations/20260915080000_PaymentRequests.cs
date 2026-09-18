using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260915080000_PaymentRequests")]
public partial class PaymentRequests : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "PaymentRequests" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Amount" numeric(18,2) NOT NULL,
                "ImageUrl" character varying(2048) NOT NULL,
                "ImageThumbUrl" character varying(2048) NULL,
                "Note" character varying(500) NULL,
                "Status" text NOT NULL DEFAULT 'Pending',
                "ReviewedById" uuid NULL,
                "RejectionReason" character varying(500) NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "ReviewedAt" timestamp with time zone NULL,
                CONSTRAINT "PK_PaymentRequests" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_PaymentRequests_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_CreatedAt"
                ON "PaymentRequests" ("CreatedAt");

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_Status"
                ON "PaymentRequests" ("Status");

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_StudentId"
                ON "PaymentRequests" ("StudentId");

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentRequests_StudentId_Pending"
                ON "PaymentRequests" ("StudentId")
                WHERE "Status" = 'Pending';

            CREATE TABLE IF NOT EXISTS "PaymentRequestRejectionReasons" (
                "Id" uuid NOT NULL,
                "Text" character varying(500) NOT NULL,
                "SortOrder" integer NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_PaymentRequestRejectionReasons" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentRequestRejectionReasons_Text"
                ON "PaymentRequestRejectionReasons" (LOWER("Text"));

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000001', 'التاريخ فى صورة التحويل قديم', 1, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('التاريخ فى صورة التحويل قديم')
            );

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000002', 'صورة التحويل مستخدمة من قبل', 2, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('صورة التحويل مستخدمة من قبل')
            );

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000003', 'تاريخ التحويل مش ظاهر فى الصوره', 3, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('تاريخ التحويل مش ظاهر فى الصوره')
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "PaymentRequests";
            """);
    }
}
