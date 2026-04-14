// src/types/db.constants.ts
// 替代 Prisma enum，用 as const 定义，变更时无需数据库迁移

export const ConversationType = {
  coach: "coach",
  writing: "writing",
  speaking: "speaking",
} as const;
export type ConversationType =
  (typeof ConversationType)[keyof typeof ConversationType];

export const MessageRole = {
  user: "user",
  assistant: "assistant",
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const EnglishLevel = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
} as const;
export type EnglishLevel = (typeof EnglishLevel)[keyof typeof EnglishLevel];

export const MembershipTier = {
  free: "free",
  pro: "pro",
} as const;
export type MembershipTier =
  (typeof MembershipTier)[keyof typeof MembershipTier];

export const ScenarioType = {
  ielts_task1: "ielts_task1",
  ielts_task2: "ielts_task2",
  cet4: "cet4",
  cet6: "cet6",
  daily: "daily",
  interview: "interview",
  travel: "travel",
  business: "business",
} as const;
export type ScenarioType = (typeof ScenarioType)[keyof typeof ScenarioType];

export const Difficulty = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const SubscriptionStatus = {
  active: "active",
  cancelled: "cancelled",
  expired: "expired",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const SubscriptionPlan = {
  monthly: "monthly",
  yearly: "yearly",
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
