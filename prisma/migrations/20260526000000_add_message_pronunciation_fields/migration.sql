ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "pronunciation_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pronunciation_accuracy" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pronunciation_fluency" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pronunciation_completeness" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pronunciation_prosody" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pronunciation_feedback" JSONB;
