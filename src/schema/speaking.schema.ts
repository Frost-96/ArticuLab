import { z } from "zod";
import { speakingExerciseStatusEnum, speakingScenarioTypeEnum } from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

// ==================== 口语练习 ====================

// F-030 + F-031: 开始口语练习
export const startSpeakingSchema = z.object({
    scenarioId: idSchema,
});

// F-032: 口语对话中发送消息（POST /api/speaking/chat）
export const speakingChatSchema = z.object({
    exerciseId: idSchema,
    conversationId: idSchema,
    message: z
        .string()
        .min(1, "Message cannot be empty")
        .max(5000, "Message must not exceed 5000 characters"),
});

// 结束口语练习
export const endSpeakingSchema = z.object({
    exerciseId: idSchema,
});

// 更新口语练习
export const updateSpeakingExerciseSchema = z
    .object({
        id: idSchema,
        status: speakingExerciseStatusEnum.optional(),
        totalTurns: z.number().int().min(0).optional(),
        durationSeconds: z.number().int().min(0).optional(),
        fluencyScore: z.number().min(0).max(10).nullable().optional(),
        accuracyScore: z.number().min(0).max(10).nullable().optional(),
        feedback: z.unknown().nullable().optional(),
    })
    .refine(
        (data) =>
            data.status !== undefined ||
            data.totalTurns !== undefined ||
            data.durationSeconds !== undefined ||
            data.fluencyScore !== undefined ||
            data.accuracyScore !== undefined ||
            data.feedback !== undefined,
        {
            message: "At least one speaking exercise field must be provided",
        },
    );

// 删除口语练习
export const deleteSpeakingExerciseSchema = z.object({
    id: idSchema,
});

// 获取口语练习详情（复盘页）
export const getSpeakingExerciseSchema = z.object({
    id: idSchema,
});

// 获取口语练习历史
export const getSpeakingHistorySchema = z.object({
    scenarioType: speakingScenarioTypeEnum.optional(),
    ...paginationSchema.shape,
});

// ==================== 语音处理 ====================

// POST /api/speech/stt
export const sttRequestSchema = z.object({
    // 音频通过 FormData 传递，这里校验元数据
    language: z.string().default("en"),
    conversationId: idSchema.optional(),
});

// POST /api/speech/tts
export const ttsRequestSchema = z.object({
    text: z
        .string()
        .min(1, "Text cannot be empty")
        .max(4096, "Text must not exceed 4096 characters"),
    voice: z
        .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
        .default("nova"),
    speed: z.number().min(0.25).max(4.0).default(1.0),
});

// ==================== AI 口语反馈结构 ====================

// F-034: 对话后复盘报告
export const speakingReviewResultSchema = z.object({
    fluencyScore: z.number().min(0).max(10),
    accuracyScore: z.number().min(0).max(10),
    overallComment: z.string(),
    grammarErrors: z.array(
        z.object({
            original: z.string(),
            corrected: z.string(),
            explanation: z.string(),
        }),
    ),
    vocabularyAnalysis: z.object({
        totalUniqueWords: z.number(),
        advancedWordsUsed: z.array(z.string()),
        suggestedVocabulary: z.array(
            z.object({
                word: z.string(),
                definition: z.string(),
                exampleSentence: z.string(),
            }),
        ),
    }),
    expressionSuggestions: z.array(
        z.object({
            original: z.string(),
            improved: z.string(),
            explanation: z.string(),
        }),
    ),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
});

// ==================== 类型导出 ====================

export type StartSpeakingInput = z.infer<typeof startSpeakingSchema>;
export type SpeakingChatInput = z.infer<typeof speakingChatSchema>;
export type EndSpeakingInput = z.infer<typeof endSpeakingSchema>;
export type UpdateSpeakingExerciseInput = z.infer<
    typeof updateSpeakingExerciseSchema
>;
export type DeleteSpeakingExerciseInput = z.infer<
    typeof deleteSpeakingExerciseSchema
>;
export type GetSpeakingExerciseInput = z.infer<
    typeof getSpeakingExerciseSchema
>;
export type GetSpeakingHistoryInput = z.infer<typeof getSpeakingHistorySchema>;
export type SttRequestInput = z.infer<typeof sttRequestSchema>;
export type TtsRequestInput = z.infer<typeof ttsRequestSchema>;
export type SpeakingReviewResult = z.infer<typeof speakingReviewResultSchema>;
