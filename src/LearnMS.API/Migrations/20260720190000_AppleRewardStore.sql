-- Apple Rewards Store (safe to re-run)
-- Catalog items, open window settings, and student redemption orders.

CREATE TABLE IF NOT EXISTS "AppleRewardItems" (
    "Id" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "ImageUrl" character varying(2000) NOT NULL,
    "AppleCost" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    "SortOrder" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AppleRewardItems" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_AppleRewardItems_IsActive"
    ON "AppleRewardItems" ("IsActive");
CREATE INDEX IF NOT EXISTS "IX_AppleRewardItems_SortOrder"
    ON "AppleRewardItems" ("SortOrder");

CREATE TABLE IF NOT EXISTS "AppleStoreSettings" (
    "Id" integer NOT NULL,
    "IsEnabled" boolean NOT NULL DEFAULT FALSE,
    "OpensAt" timestamp with time zone NULL,
    "ClosesAt" timestamp with time zone NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AppleStoreSettings" PRIMARY KEY ("Id")
);

INSERT INTO "AppleStoreSettings" ("Id", "IsEnabled", "OpensAt", "ClosesAt", "UpdatedAt")
SELECT 1, FALSE, NULL, NULL, TIMESTAMPTZ '2026-07-20 00:00:00+00'
WHERE NOT EXISTS (
    SELECT 1 FROM "AppleStoreSettings" WHERE "Id" = 1
);

CREATE TABLE IF NOT EXISTS "AppleRewardOrders" (
    "Id" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "ItemId" uuid NOT NULL,
    "ItemTitleSnapshot" character varying(200) NOT NULL,
    "AppleCostSnapshot" integer NOT NULL,
    "Status" character varying(32) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "CancelledAt" timestamp with time zone NULL,
    CONSTRAINT "PK_AppleRewardOrders" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AppleRewardOrders_Students_StudentId"
        FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AppleRewardOrders_AppleRewardItems_ItemId"
        FOREIGN KEY ("ItemId") REFERENCES "AppleRewardItems" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_AppleRewardOrders_StudentId"
    ON "AppleRewardOrders" ("StudentId");
CREATE INDEX IF NOT EXISTS "IX_AppleRewardOrders_ItemId"
    ON "AppleRewardOrders" ("ItemId");
CREATE INDEX IF NOT EXISTS "IX_AppleRewardOrders_Status"
    ON "AppleRewardOrders" ("Status");
CREATE INDEX IF NOT EXISTS "IX_AppleRewardOrders_CreatedAt"
    ON "AppleRewardOrders" ("CreatedAt");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260720190000_AppleRewardStore', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260720190000_AppleRewardStore'
);
