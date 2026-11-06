-- Jalankan sebelum `prisma db push` bila tabel daily_log_items sudah berisi data.
-- Constraint unik (dailyLogId, exerciseId) gagal dibuat kalau masih ada duplikat.

-- 1. Cek duplikat (hasil harus kosong sebelum lanjut)
SELECT "dailyLogId", "exerciseId", COUNT(*) AS n
FROM daily_log_items
GROUP BY 1, 2
HAVING COUNT(*) > 1;

BEGIN;

-- 2. Hapus duplikat, pertahankan baris yang sudah dicentang, lalu yang terlama
DELETE FROM daily_log_items d
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "dailyLogId", "exerciseId"
           ORDER BY "isChecked" DESC, id
         ) AS rn
  FROM daily_log_items
) r
WHERE d.id = r.id AND r.rn > 1;

-- 3. Constraint dan index (nama sama dengan yang dibuat Prisma)
CREATE UNIQUE INDEX IF NOT EXISTS "daily_log_items_dailyLogId_exerciseId_key"
  ON daily_log_items ("dailyLogId", "exerciseId");
DROP INDEX IF EXISTS "daily_log_items_dailyLogId_idx";

CREATE INDEX IF NOT EXISTS "exercises_userId_createdAt_idx" ON exercises ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "plans_userId_createdAt_idx" ON plans ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "plan_items_planId_order_idx" ON plan_items ("planId", "order");
CREATE INDEX IF NOT EXISTS "plan_items_exerciseId_idx" ON plan_items ("exerciseId");

COMMIT;
