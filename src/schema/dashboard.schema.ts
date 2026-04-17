import { z } from "zod";
import { dateRangeSchema } from "./shared.schema";

// ==================== 学习中心 ====================

// F-040: 获取学习统计概览
export const getLearningStatsSchema = z.object({
    ...dateRangeSchema.shape,
});

// F-041: 写作能力雷达图数据
export const getWritingRadarSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
});

// F-042: 口语能力趋势数据
export const getSpeakingTrendSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
});

// F-043: 弱项分析
export const getWeaknessAnalysisSchema = z.object({
    recentCount: z.coerce.number().int().min(3).max(50).default(10),
    topN: z.coerce.number().int().min(1).max(10).default(3),
});

// ==================== 响应结构 ====================

// 学习统计概览
export const learningStatsSchema = z.object({
    totalExercises: z.number(),
    totalDurationMinutes: z.number(),
    consecutiveDays: z.number(),
    writingCount: z.number(),
    speakingCount: z.number(),
    coachChatCount: z.number(),
});

// 写作雷达图数据
export const writingRadarDataSchema = z.object({
    grammar: z.number().min(0).max(9),
    vocabulary: z.number().min(0).max(9),
    coherence: z.number().min(0).max(9),
    task: z.number().min(0).max(9),
    overall: z.number().min(0).max(9),
});

// 口语趋势数据点
export const speakingTrendPointSchema = z.object({
    date: z.string(),
    fluency: z.number().min(0).max(10),
    accuracy: z.number().min(0).max(10),
});

// 弱项
export const weaknessItemSchema = z.object({
    category: z.string(),
    description: z.string(),
    frequency: z.number(), // 出现次数
    suggestion: z.string(),
});

// ==================== 类型导出 ====================

export type GetLearningStatsInput = z.infer<typeof getLearningStatsSchema>;
export type GetWritingRadarInput = z.infer<typeof getWritingRadarSchema>;
export type GetSpeakingTrendInput = z.infer<typeof getSpeakingTrendSchema>;
export type GetWeaknessAnalysisInput = z.infer<
    typeof getWeaknessAnalysisSchema
>;
export type LearningStats = z.infer<typeof learningStatsSchema>;
export type WritingRadarData = z.infer<typeof writingRadarDataSchema>;
export type SpeakingTrendPoint = z.infer<typeof speakingTrendPointSchema>;
export type WeaknessItem = z.infer<typeof weaknessItemSchema>;
