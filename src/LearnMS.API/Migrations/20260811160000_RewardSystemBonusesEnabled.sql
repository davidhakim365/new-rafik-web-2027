ALTER TABLE "RewardSystemSettings"
ADD COLUMN IF NOT EXISTS "BonusesEnabled" boolean NOT NULL DEFAULT TRUE;
