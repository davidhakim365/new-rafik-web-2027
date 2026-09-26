using LearnMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Discounts;

public static class DiscountsSchema
{
    public static Task EnsureAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync("""
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
}
