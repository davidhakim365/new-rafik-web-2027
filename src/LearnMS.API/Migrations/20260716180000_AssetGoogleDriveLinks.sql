-- Apply Google Drive PDF link columns on Asset (safe to re-run)
-- Do NOT use `dotnet ef database update` if Init is pending — it will try to recreate Accounts.

ALTER TABLE "Asset"
    ADD COLUMN IF NOT EXISTS "Url" text NULL;

ALTER TABLE "Asset"
    ADD COLUMN IF NOT EXISTS "LectureName" text NULL;

-- Record migration so EF does not try to re-apply it
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260716180000_AssetGoogleDriveLinks', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260716180000_AssetGoogleDriveLinks'
);
