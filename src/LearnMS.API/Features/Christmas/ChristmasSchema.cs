using LearnMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Christmas;

public static class ChristmasSchema
{
    public static Task EnsureAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "ChristmasSettings" (
                "Id" integer NOT NULL,
                "Enabled" boolean NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_ChristmasSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "ChristmasSettings" ("Id", "Enabled", "UpdatedAt")
            SELECT 1, FALSE, TIMESTAMPTZ '2026-11-28 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "ChristmasSettings" WHERE "Id" = 1
            );
            """);
    }
}
