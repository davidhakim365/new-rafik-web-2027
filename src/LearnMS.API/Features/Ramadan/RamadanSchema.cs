using LearnMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Ramadan;

public static class RamadanSchema
{
    public static Task EnsureAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "RamadanSettings" (
                "Id" integer NOT NULL,
                "Enabled" boolean NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_RamadanSettings" PRIMARY KEY ("Id")
            );

            INSERT INTO "RamadanSettings" ("Id", "Enabled", "UpdatedAt")
            SELECT 1, FALSE, TIMESTAMPTZ '2026-11-28 00:00:00+00'
            WHERE NOT EXISTS (
                SELECT 1 FROM "RamadanSettings" WHERE "Id" = 1
            );
            """);
    }
}
