import { z } from "zod";
import { speakingScenarioTypeEnum, difficultyEnum } from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

// ==================== 口语练习 ====================

// F-030 + F-031: 开始口语练习
// 支持两种模式：
// 1. 基于场景ID（scenarioId）：从数据库加载场景配置
// 2. 基于自定义参数（scenarioCategory + title + aiRole）：直接传入配置
export const startSpeakingSchema = z.object({
    scenarioId: idSchema.optional(),
    scenarioCategory: speakingScenarioTypeEnum.optional(),
    title: z.string().min(1, "Title is required").max(200, "Title must not exceed 200 characters").optional(),
    aiRole: z.string().min(1, "AI role is required").max(200, "AI role must not exceed 200 characters").optional(),
}).refine((data) => {
    const hasScenarioId = !!data.scenarioId;
    const hasCustomParams = !!data.scenarioCategory && !!data.title && !!data.aiRole;

    // 情况1：提供了 scenarioId，则其他三个字段不能存在
    if (hasScenarioId) {
        if (data.scenarioCategory || data.title || data.aiRole) {
            return false;
        }
        return true;
    }

    // 情况2：没有提供 scenarioId，则其他三个字段都必须存在
    if (!hasCustomParams) {
        return false;
    }

    return true;
}, {
    message: "Either provide scenarioId alone, or provide scenarioCategory, title, and aiRole together",
});

// F-032: 口语对话中发送消息（POST /api/speaking/chat）
export const speakingChatSchema = z.object({
    exerciseId: idSchema,
    conversationId: idSchema,
    // message: z
    //     .string()
    //     .min(1, "Message cannot be empty")
    //     .max(5000, "Message must not exceed 5000 characters"),
    audioUrl: z.string().url("Invalid audio URL"),
});

// 结束口语练习
export const endSpeakingSchema = z.object({
    exerciseId: idSchema,
});

// 删除口语练习
export const deleteSpeakingExerciseSchema = z.object({
    exerciseId: idSchema,
});

// 获取口语练习详情（复盘页）
export const getSpeakingExerciseSchema = z.object({
    id: idSchema,
});

// 获取口语练习会话消息（支持游标分页）
export const getSpeakingMessagesSchema = z.object({
    conversationId: idSchema,
    cursor: idSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
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
export type DeleteSpeakingExerciseInput = z.infer<typeof deleteSpeakingExerciseSchema>;
export type GetSpeakingExerciseInput = z.infer<
    typeof getSpeakingExerciseSchema
>;
export type GetSpeakingMessagesInput = z.infer<
    typeof getSpeakingMessagesSchema
>;
export type GetSpeakingHistoryInput = z.infer<typeof getSpeakingHistorySchema>;
export type SttRequestInput = z.infer<typeof sttRequestSchema>;
export type TtsRequestInput = z.infer<typeof ttsRequestSchema>;
export type SpeakingReviewResult = z.infer<typeof speakingReviewResultSchema>;