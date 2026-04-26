import { z } from "zod";
import {
    conversationTypeEnum,
    englishLevelEnum,
    membershipTierEnum,
} from "./enums";
import { dateRangeSchema } from "./shared.schema";

// ==================== Dashboard Queries ====================

export const getLearningStatsSchema = z.object({
    ...dateRangeSchema.shape,
});

export const getWritingRadarSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
});

export const getSpeakingTrendSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
});

export const getWeaknessAnalysisSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
    topN: z.coerce.number().int().min(1).max(10).default(3),
});

// ==================== Dashboard DTO ====================

export const dashboardHeaderSchema = z.object({
    displayName: z.string().min(1),
    englishLevel: englishLevelEnum.nullable(),
    englishLevelLabel: z.string().min(1).nullable(),
    membershipTier: membershipTierEnum,
});

export const dashboardStatsSchema = z.object({
    totalSessions: z.number().int().min(0),
    recordedPracticeMinutes: z.number().int().min(0),
    consecutiveDays: z.number().int().min(0),
    writingCount: z.number().int().min(0),
    speakingCount: z.number().int().min(0),
    coachChatCount: z.number().int().min(0),
    englishLevel: englishLevelEnum.nullable(),
    englishLevelLabel: z.string().min(1).nullable(),
});

export const dashboardRadarItemSchema = z.object({
    skill: z.enum([
        "Grammar",
        "Vocabulary",
        "Coherence",
        "Task",
        "Fluency",
        "Accuracy",
    ]),
    score: z.number().min(0).max(10).nullable(),
});

export const dashboardTrendPointSchema = z.object({
    label: z.string().min(1),
    writingScore: z.number().min(0).max(10).nullable(),
    speakingScore: z.number().min(0).max(10).nullable(),
});

export const dashboardActivitySchema = z.object({
    id: z.string().min(1),
    type: conversationTypeEnum,
    title: z.string().min(1),
    subtitle: z.string().nullable(),
    score: z.number().min(0).max(10).nullable(),
    scoreLabel: z.string().nullable(),
    timeLabel: z.string().min(1),
    href: z.string().min(1),
});

export const dashboardWeaknessSchema = z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    frequency: z.number().int().min(1),
    suggestion: z.string().min(1),
    href: z.string().min(1),
});

export const dashboardEmptyStatesSchema = z.object({
    hasAnyActivity: z.boolean(),
    hasWritingData: z.boolean(),
    hasSpeakingData: z.boolean(),
    hasFullRadarData: z.boolean(),
    hasTrendData: z.boolean(),
    hasWeaknessData: z.boolean(),
});

export const dashboardDataSchema = z.object({
    header: dashboardHeaderSchema,
    stats: dashboardStatsSchema,
    radar: z.array(dashboardRadarItemSchema),
    trend: z.array(dashboardTrendPointSchema),
    weaknesses: z.array(dashboardWeaknessSchema),
    recentActivities: z.array(dashboardActivitySchema),
    emptyStates: dashboardEmptyStatesSchema,
});

// ==================== Backward-Compatible Aliases ====================

export const learningStatsSchema = dashboardStatsSchema;
export const writingRadarDataSchema = z.array(dashboardRadarItemSchema);
export const speakingTrendPointSchema = dashboardTrendPointSchema;
export const speakingTrendSchema = z.array(dashboardTrendPointSchema);
export const weaknessItemSchema = dashboardWeaknessSchema;
export const weaknessAnalysisSchema = z.array(dashboardWeaknessSchema);

// ==================== Types ====================

export type GetLearningStatsInput = z.infer<typeof getLearningStatsSchema>;
export type GetWritingRadarInput = z.infer<typeof getWritingRadarSchema>;
export type GetSpeakingTrendInput = z.infer<typeof getSpeakingTrendSchema>;
export type GetWeaknessAnalysisInput = z.infer<
    typeof getWeaknessAnalysisSchema
>;

export type DashboardHeader = z.infer<typeof dashboardHeaderSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type DashboardRadarItem = z.infer<typeof dashboardRadarItemSchema>;
export type DashboardTrendPoint = z.infer<typeof dashboardTrendPointSchema>;
export type DashboardActivity = z.infer<typeof dashboardActivitySchema>;
export type DashboardWeakness = z.infer<typeof dashboardWeaknessSchema>;
export type DashboardEmptyStates = z.infer<typeof dashboardEmptyStatesSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;

export type LearningStats = DashboardStats;
export type WritingRadarData = z.infer<typeof writingRadarDataSchema>;
export type SpeakingTrendPoint = DashboardTrendPoint;
export type WeaknessItem = DashboardWeakness;
