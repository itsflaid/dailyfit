-- Hanya menambah kolom dan tabel, jadi aman dijalankan sebelum kode baru di-deploy.

ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "exercises" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "daily_log_items" ADD COLUMN "snapshot" JSONB;

-- Riwayat lama dibekukan memakai nilai latihan saat migrasi dijalankan.
UPDATE "daily_log_items" i
SET "snapshot" = jsonb_build_object(
    'name', e."name",
    'category', e."category",
    'type', e."type",
    'muscleGroup', e."muscleGroup",
    'reps', e."reps",
    'sets', e."sets",
    'durationSeconds', e."durationSeconds",
    'timeSets', e."timeSets"
)
FROM "exercises" e
WHERE e."id" = i."exerciseId";

CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limits_resetAt_idx" ON "rate_limits"("resetAt");
