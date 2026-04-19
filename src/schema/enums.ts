// src/validators/enums.ts

import { z } from "zod";

// ==================== 枚举定义 ====================

export const conversationTypeEnum = z.enum(["coach", "writing", "speaking"]);

export const englishLevelEnum = z.enum([
    "beginner",
    "intermediate",
    "advanced",
]);

export const membershipTierEnum = z.enum(["free", "pro"]);

export const scenarioTypeEnum = z.enum([
    "ielts_task1",
    "ielts_task2",
    "cet4",
    "cet6",
    "daily",
    "interview",
    "travel",
    "business",
    "free",
]);

// 写作场景：考试类型 + 日常
export const writingScenarioTypeEnum = z.enum([
    "ielts_task1",
    "ielts_task2",
    "cet4",
    "cet6",
    "daily",
]);

// 口语场景
export const speakingScenarioTypeEnum = z.enum([
    "daily",
    "interview",
    "travel",
    "business",
    "free",
]);

export const difficultyEnum = z.enum(["easy", "medium", "hard"]);

export const subscriptionStatusEnum = z.enum([
    "active",
    "cancelled",
    "expired",
]);

export const subscriptionPlanEnum = z.enum(["monthly", "yearly"]);

export const messageRoleEnum = z.enum(["user", "assistant"]);

export const scenarioCategoryEnum = z.enum(["writing", "speaking"]);

// 写作练习状态
export const writingExerciseStatusEnum = z.enum(["draft", "completed"]);

// 批改反馈严重程度
export const feedbackSeverityEnum = z.enum(["error", "warning", "suggestion"]);

// ==================== 类型导出 ====================

export type ConversationType = z.infer<typeof conversationTypeEnum>;
export type EnglishLevel = z.infer<typeof englishLevelEnum>;
export type MembershipTier = z.infer<typeof membershipTierEnum>;
export type ScenarioType = z.infer<typeof scenarioTypeEnum>;
export type WritingScenarioType = z.infer<typeof writingScenarioTypeEnum>;
export type SpeakingScenarioType = z.infer<typeof speakingScenarioTypeEnum>;
export type Difficulty = z.infer<typeof difficultyEnum>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanEnum>;
export type MessageRole = z.infer<typeof messageRoleEnum>;
export type ScenarioCategory = z.infer<typeof scenarioCategoryEnum>;
export type WritingExerciseStatus = z.infer<typeof writingExerciseStatusEnum>;
export type FeedbackSeverity = z.infer<typeof feedbackSeverityEnum>;
