// src/validators/writing.ts

import { z } from "zod";
import { writingScenarioTypeEnum } from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

// ==================== 写作练习 ====================

// F-020 + F-021 + F-022: 提交写作练习
export const submitWritingSchema = z
    .object({
        scenarioType: writingScenarioTypeEnum,
        prompt: z
            .string()
            .min(1, "Prompt cannot be empty")
            .max(2000, "Prompt must not exceed 2000 characters"),
        isCustomPrompt: z.boolean(),
        content: z
            .string()
            .min(1, "Content cannot be empty")
            .max(50000, "Content must not exceed 50000 characters"),
    })
    .refine(
        (data) => {
            const wordCount = data.content.trim().split(/\s+/).length;
            return wordCount >= 20;
        },
        {
            message: "Content is too short (at least 20 words required)",
            path: ["content"],
        },
    )
    .refine(
        (data) => {
            // 考试类型必须是用户自定义题目
            if (data.scenarioType !== "daily")
                return data.isCustomPrompt === true;
            return true;
        },
        {
            message: "Exam-type writing requires a custom prompt",
            path: ["isCustomPrompt"],
        },
    );

// F-021: 保存草稿
export const saveDraftSchema = z.object({
    exerciseId: idSchema.optional(), // 首次保存时无 ID
    scenarioType: writingScenarioTypeEnum,
    prompt: z.string().max(2000).default(""),
    isCustomPrompt: z.boolean().default(false),
    content: z.string().max(50000).default(""),
});

// 获取写作练习详情（批改结果页）
export const getWritingExerciseSchema = z.object({
    id: idSchema,
});

// 获取写作练习历史
export const getWritingHistorySchema = z.object({
    scenarioType: writingScenarioTypeEnum.optional(),
    ...paginationSchema.shape,
});

// ==================== AI 批改反馈结构 ====================

// 逐句点评项
export const sentenceFeedbackSchema = z.object({
    original: z.string(),
    corrected: z.string().optional(),
    severity: z.enum(["error", "warning", "suggestion"]),
    category: z.string(), // grammar / vocabulary / coherence / task
    explanation: z.string(),
    alternatives: z.array(z.string()).optional(),
});

// 完整批改结果（AI 返回的 JSON 结构）
export const writingReviewResultSchema = z.object({
    overallScore: z.number().min(0).max(9),
    grammarScore: z.number().min(0).max(9),
    vocabularyScore: z.number().min(0).max(9),
    coherenceScore: z.number().min(0).max(9),
    taskScore: z.number().min(0).max(9),
    overallComment: z.string(),
    sentenceFeedback: z.array(sentenceFeedbackSchema),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    sampleExpressions: z
        .array(
            z.object({
                original: z.string(),
                improved: z.string(),
                explanation: z.string(),
            }),
        )
        .optional(),
});

// ==================== 类型导出 ====================

export type SubmitWritingInput = z.infer<typeof submitWritingSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type GetWritingExerciseInput = z.infer<typeof getWritingExerciseSchema>;
export type GetWritingHistoryInput = z.infer<typeof getWritingHistorySchema>;
export type SentenceFeedback = z.infer<typeof sentenceFeedbackSchema>;
export type WritingReviewResult = z.infer<typeof writingReviewResultSchema>;
