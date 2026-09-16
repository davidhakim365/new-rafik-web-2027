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
