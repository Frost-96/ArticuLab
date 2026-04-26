-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "email_verified" TIMESTAMP(3),
    "name" VARCHAR(100),
    "avatar" VARCHAR(500),
    "password" VARCHAR(255),
    "english_level" VARCHAR(20) DEFAULT 'beginner',
    "learning_goal" TEXT,
    "membership_tier" VARCHAR(20) NOT NULL DEFAULT 'free',
    "membership_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200),
    "scenario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "audio_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_exercises" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "scenario_type" VARCHAR(30) NOT NULL,
    "prompt" TEXT NOT NULL,
    "is_custom_prompt" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "overall_score" DOUBLE PRECISION,
    "grammar_score" DOUBLE PRECISION,
    "vocabulary_score" DOUBLE PRECISION,
    "coherence_score" DOUBLE PRECISION,
    "task_score" DOUBLE PRECISION,
    "feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "writing_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_exercises" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "scenario_type" VARCHAR(30) NOT NULL,
    "scenario_role" VARCHAR(100) NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "total_turns" INTEGER,
    "duration_seconds" INTEGER,
    "fluency_score" DOUBLE PRECISION,
    "accuracy_score" DOUBLE PRECISION,
    "feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "speaking_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "ai_role" TEXT,
    "difficulty" VARCHAR(10) NOT NULL,
    "is_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "payment_provider" VARCHAR(50) NOT NULL,
    "external_id" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_membership_tier" ON "users"("membership_tier");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "idx_email_verifications_email" ON "email_verifications"("email");

-- CreateIndex
CREATE INDEX "idx_email_verifications_token" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "idx_conversations_user_id" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "idx_conversations_user_updated_at" ON "conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "idx_conversations_scenario_id" ON "conversations"("scenario_id");

-- CreateIndex
CREATE INDEX "idx_conversations_type" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "idx_messages_conversation_id" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_messages_conversation_created_at" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_writing_exercises_user_id" ON "writing_exercises"("user_id");

-- CreateIndex
CREATE INDEX "idx_writing_exercises_user_created_at" ON "writing_exercises"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_writing_exercises_scenario_id" ON "writing_exercises"("scenario_id");

-- CreateIndex
CREATE INDEX "idx_writing_exercises_status" ON "writing_exercises"("status");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_exercises_conversation_id_key" ON "speaking_exercises"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_speaking_exercises_user_id" ON "speaking_exercises"("user_id");

-- CreateIndex
CREATE INDEX "idx_speaking_exercises_user_created_at" ON "speaking_exercises"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_speaking_exercises_scenario_id" ON "speaking_exercises"("scenario_id");

-- CreateIndex
CREATE INDEX "idx_speaking_exercises_status" ON "speaking_exercises"("status");

-- CreateIndex
CREATE INDEX "idx_scenarios_type_category" ON "scenarios"("type", "category");

-- CreateIndex
CREATE INDEX "idx_scenarios_difficulty" ON "scenarios"("difficulty");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_external_id" ON "subscriptions"("external_id");

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_exercises" ADD CONSTRAINT "writing_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_exercises" ADD CONSTRAINT "writing_exercises_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_exercises" ADD CONSTRAINT "speaking_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_exercises" ADD CONSTRAINT "speaking_exercises_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_exercises" ADD CONSTRAINT "speaking_exercises_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
