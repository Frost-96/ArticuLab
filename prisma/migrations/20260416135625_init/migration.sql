/*
  Warnings:

  - You are about to alter the column `fluency_score` on the `speaking_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `accuracy_score` on the `speaking_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `overall_score` on the `writing_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `grammar_score` on the `writing_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `vocabulary_score` on the `writing_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `coherence_score` on the `writing_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `task_score` on the `writing_exercises` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "scenarios" ALTER COLUMN "ai_role" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "speaking_exercises" ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
ALTER COLUMN "total_turns" DROP NOT NULL,
ALTER COLUMN "duration_seconds" DROP NOT NULL,
ALTER COLUMN "fluency_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "accuracy_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "writing_exercises" ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
ALTER COLUMN "overall_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "grammar_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "vocabulary_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "coherence_score" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "task_score" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "idx_email_verifications_email" ON "email_verifications"("email");

-- CreateIndex
CREATE INDEX "idx_email_verifications_token" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "idx_conversations_user_updated_at" ON "conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "idx_speaking_exercises_status" ON "speaking_exercises"("status");

-- CreateIndex
CREATE INDEX "idx_writing_exercises_status" ON "writing_exercises"("status");

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
