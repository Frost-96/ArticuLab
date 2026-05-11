// src/server/services/speaking.service.ts

import * as speakingRepo from "@/server/repositories/speaking.repository";
import * as conversationService from "./conversation.service";
import * as messageService from "./message.service";
import { prisma } from "@/lib/prisma";
import { speechToText } from "@/lib/speaking/stt";
import { textToSpeech } from "@/lib/speaking/tts";
import { generateSpeakingResponse } from "@/lib/speaking/aiChat";
import { generateSpeakingReview } from "@/lib/speaking/aiReview";
import { getFirstError } from "@/lib/error";
import { idSchema } from "@/schema/shared.schema";
import {
    startSpeakingSchema,
    speakingChatSchema,
    endSpeakingSchema,
    getSpeakingExerciseSchema,
    getSpeakingHistorySchema,
    deleteSpeakingExerciseSchema,
    speakingReviewResultSchema,
    type StartSpeakingInput,
    type SpeakingChatInput,
    type EndSpeakingInput,
    type GetSpeakingExerciseInput,
    type GetSpeakingHistoryInput,
    type DeleteSpeakingExerciseInput,
    type SpeakingReviewResult,
} from "@/schema/speaking.schema";
import type { SpeakingScenarioType, SpeakingExerciseStatus } from "@/schema/enums";
import type {
    SpeakingExerciseSummary,
    SpeakingExerciseDetail,
    SpeakingHistoryResult,
    StartSpeakingResult,
    SpeakingChatResult,
    EndSpeakingResult,
} from "@/types/speaking/speakingTypes";

// ==================== 辅助函数 ====================

/**
 * 判断练习是否已完成
 * @param ex - 练习对象
 * @returns 是否完成
 */
function isCompleted(ex: { status: string }): boolean {
    return ex.status === "completed";
}

/**
 * 解析反馈数据
 * @param feedback - 原始反馈数据
 * @returns 解析后的反馈或 null
 */
function parseFeedback(feedback: unknown): SpeakingReviewResult | null {
    if (!feedback) return null;
    
    const result = speakingReviewResultSchema.safeParse(feedback);
    return result.success ? result.data : null;
}

/**
 * 格式化练习摘要（需要关联 Conversation 获取 title）
 * @param ex - Repository 返回的练习对象
 * @param conversationTitle - 会话标题
 * @returns 格式化后的练习摘要
 */
function formatExerciseSummary(
    ex: NonNullable<Awaited<ReturnType<typeof speakingRepo.findSpeakingExerciseById>>>,
    conversationTitle: string | null
): SpeakingExerciseSummary {
    return {
        id: ex.id,
        conversationId: ex.conversationId,
        title: conversationTitle,
        scenarioType: ex.scenarioType as SpeakingScenarioType,
        scenarioRole: ex.scenarioRole,
        status: ex.status as SpeakingExerciseStatus,
        totalTurns: ex.totalTurns,
        durationSeconds: ex.durationSeconds,
        fluencyScore: ex.fluencyScore,
        accuracyScore: ex.accuracyScore,
        createdAt: ex.createdAt.toISOString(),
        completedAt: isCompleted(ex) ? (ex.updatedAt as Date).toISOString() : null,
    };
}

// ==================== 开始口语练习 ====================

/**
 * 开始口语练习
 * - 创建会话记录
 * - 创建口语练习记录（status: 'in_progress'）
 * @param userId - 用户 ID
 * @param params - 输入参数（scenarioId 或 scenarioCategory + title + aiRole）
 * @returns 创建的练习和会话信息
 */
export async function startSpeakingExercise(
    userId: string,
    params: StartSpeakingInput
): Promise<{ exercise: StartSpeakingResult }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = startSpeakingSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    let scenarioType: SpeakingScenarioType;
    let scenarioRole: string;
    let conversationTitle: string;
    let scenarioId: string | null = null;

    // 根据输入模式确定参数
    if (parsedParams.data.scenarioId) {
        // 模式1：基于场景ID，从数据库加载配置
        const scenario = await prisma.scenario.findUnique({
            where: { id: parsedParams.data.scenarioId },
        });

        if (!scenario) {
            throw new Error("场景不存在");
        }

        if (scenario.type !== "speaking") {
            throw new Error("该场景不是口语场景");
        }

        scenarioId = scenario.id;
        scenarioType = scenario.category as SpeakingScenarioType;
        scenarioRole = scenario.aiRole ?? "English Tutor";
        conversationTitle = scenario.title;
    } else if (parsedParams.data.scenarioCategory && parsedParams.data.title && parsedParams.data.aiRole) {
        // 模式2：使用自定义参数
        scenarioType = parsedParams.data.scenarioCategory;
        scenarioRole = parsedParams.data.aiRole;
        conversationTitle = parsedParams.data.title;
        scenarioId = null;
    } else {
        throw new Error("Invalid input: either provide scenarioId or provide scenarioCategory, title, and aiRole together");
    }

    // 使用事务创建会话和练习
    const result = await prisma.$transaction(async (tx) => {
        // 1. 创建会话
        const conversation = await tx.conversation.create({
            data: {
                userId,
                type: "speaking",
                title: conversationTitle,
                scenarioId,
            },
        });

        // 2. 创建口语练习
        const exercise = await tx.speakingExercise.create({
            data: {
                userId,
                scenarioId,
                scenarioType,
                scenarioRole,
                conversationId: conversation.id,
                status: "in_progress",
            },
        });

        return { conversation, exercise };
    });

    return {
        exercise: {
            exerciseId: result.exercise.id,
            conversationId: result.conversation.id,
            scenarioType: result.exercise.scenarioType as SpeakingScenarioType,
            scenarioRole: result.exercise.scenarioRole,
            status: "in_progress",
            createdAt: result.exercise.createdAt.toISOString(),
        },
    };
}

// ==================== 口语对话交互 ====================

/**
 * 处理口语对话中的一轮交互
 * - STT: 将用户音频转为文本
 * - AI: 生成口语对话回复
 * - TTS: 将 AI 回复转为语音
 * - 保存用户消息和 AI 回复
 * - 更新练习的总轮次
 * @param userId - 用户 ID
 * @param params - 对话参数（exerciseId, conversationId, audioUrl）
 * @returns STT 识别文本、AI 回复、TTS 音频 URL 和消息 ID
 */
export async function processSpeakingChat(
    userId: string,
    params: SpeakingChatInput
): Promise<{ chat: SpeakingChatResult }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = speakingChatSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { exerciseId, conversationId, audioUrl } = parsedParams.data;

    // 验证练习所有权
    const exercise = await speakingRepo.findSpeakingExerciseById(exerciseId, userId);
    if (!exercise) {
        throw new Error("练习不存在或无权访问");
    }

    if (exercise.status !== "in_progress") {
        throw new Error("练习已结束，无法继续对话");
    }

    // 1. STT: 音频转文本
    const userMessage = await speechToText(audioUrl);

    // 2. AI: 生成对话回复
    const history = await messageService.getConversationMessages({ conversationId, limit: 1000 });
    const assistantResponse = await generateSpeakingResponse(
        userMessage,
        history.messages,
        exercise.scenarioType,
        exercise.scenarioRole
    );

    // 3. TTS: 文本转语音
    const assistantAudioUrl = await textToSpeech(assistantResponse);

    // 4. 保存用户消息和 AI 回复
    const messages = await messageService.saveManyMessages([
        {
            conversationId,
            role: "user",
            content: userMessage,
            audioUrl,
        },
        {
            conversationId,
            role: "assistant",
            content: assistantResponse,
            audioUrl: assistantAudioUrl,
        },
    ]);

    // 5. 更新练习的总轮次
    const newTurns = (exercise.totalTurns ?? 0) + 1;
    await speakingRepo.updateSpeakingExercise(exerciseId, {
        totalTurns: newTurns,
    });

    if (!messages.messages[0] || !messages.messages[1]) {
        throw new Error("消息保存失败");
    }

    return {
        chat: {
            userMessageId: messages.messages[0].id,
            userMessage,
            assistantMessageId: messages.messages[1].id,
            assistantResponse,
            assistantAudioUrl,
            turnNumber: newTurns,
        },
    };
}

// ==================== 结束口语练习 ====================

/**
 * 结束口语练习并生成 AI 反馈
 * - 获取会话消息历史
 * - 调用 AI 评估服务生成反馈
 * - 更新练习状态为 'completed'
 * - 保存分数和反馈
 * @param userId - 用户 ID
 * @param params - 结束参数（exerciseId）
 * @returns 完整的评估结果
 */
export async function endSpeakingExercise(
    userId: string,
    params: EndSpeakingInput
): Promise<{ result: EndSpeakingResult }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = endSpeakingSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { exerciseId } = parsedParams.data;

    // 验证练习所有权
    const exercise = await speakingRepo.findSpeakingExerciseById(exerciseId, userId);
    if (!exercise) {
        throw new Error("练习不存在或无权访问");
    }

    if (isCompleted(exercise)) {
        throw new Error("练习已完成，无法重复提交");
    }

    // 1. 获取会话消息历史
    const history = await messageService.getConversationMessages({ conversationId: exercise.conversationId, limit: 1000 });

    // 2. AI: 生成评估反馈
    const feedback = await generateSpeakingReview(
        history.messages,
        exercise.scenarioType,
        exercise.scenarioRole
    );

    // 3. 计算持续时间（从创建到现在）
    const durationSeconds = Math.floor(
        (Date.now() - exercise.createdAt.getTime()) / 1000
    );

    // 4. 更新练习记录
    const updated = await speakingRepo.updateSpeakingExercise(exerciseId, {
        status: "completed",
        totalTurns: exercise.totalTurns ?? 0,
        durationSeconds,
        fluencyScore: feedback.fluencyScore,
        accuracyScore: feedback.accuracyScore,
        feedback: feedback as object,
    });

    return {
        result: {
            exerciseId: updated.id,
            status: "completed",
            totalTurns: updated.totalTurns ?? 0,
            durationSeconds: updated.durationSeconds ?? 0,
            fluencyScore: updated.fluencyScore ?? 0,
            accuracyScore: updated.accuracyScore ?? 0,
            feedback,
            completedAt: (updated.updatedAt as Date).toISOString(),
        },
    };
}

// ==================== 获取口语练习详情 ====================

/**
 * 获取口语练习详情（用于复盘页）
 * @param userId - 用户 ID
 * @param params - 查询参数（id）
 * @returns 练习详情（包含反馈）
 */
export async function getSpeakingExerciseDetail(
    userId: string,
    params: GetSpeakingExerciseInput
): Promise<{ exercise: SpeakingExerciseDetail }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = getSpeakingExerciseSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const exerciseId = parsedParams.data.id;

    const ex = await speakingRepo.findSpeakingExerciseById(exerciseId, userId);
    if (!ex) {
        throw new Error("练习不存在或无权访问");
    }

    const fb = parseFeedback(ex.feedback);

    return {
        exercise: {
            id: ex.id,
            userId: ex.userId,
            scenarioType: ex.scenarioType as SpeakingScenarioType,
            scenarioRole: ex.scenarioRole,
            conversationId: ex.conversationId,
            status: ex.status as SpeakingExerciseStatus,
            totalTurns: ex.totalTurns,
            durationSeconds: ex.durationSeconds,
            scores: isCompleted(ex)
                ? {
                      fluency: ex.fluencyScore,
                      accuracy: ex.accuracyScore,
                  }
                : {
                      fluency: null,
                      accuracy: null,
                  },
            feedback: fb ?? null,
            scenarioId: ex.scenarioId,
            createdAt: ex.createdAt.toISOString(),
            completedAt: isCompleted(ex) ? (ex.updatedAt as Date).toISOString() : null,
        },
    };
}

// ==================== 获取口语练习历史 ====================

/**
 * 获取口语练习历史（带分页和统计）
 * @param userId - 用户 ID
 * @param params - 筛选和分页参数（scenarioType?, page, pageSize）
 * @returns 练习列表、分页信息和统计摘要
 */
export async function getSpeakingHistory(
    userId: string,
    params: GetSpeakingHistoryInput
): Promise<SpeakingHistoryResult> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = getSpeakingHistorySchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { scenarioType, page, pageSize: limit } = parsedParams.data;
    const skip = (page - 1) * limit;

    // 获取练习列表
    const { rows, total } = await speakingRepo.findSpeakingExercises({
        userId,
        scenarioType,
        skip,
        take: limit,
    });

    // 获取所有会话标题（批量查询优化）
    const conversationIds = rows.map((ex) => ex.conversationId);
    const conversations = await prisma.conversation.findMany({
        where: { id: { in: conversationIds } },
        select: { id: true, title: true },
    });
    const conversationMap = new Map(conversations.map((c) => [c.id, c.title]));

    // 格式化列表
    const exercises: SpeakingExerciseSummary[] = rows.map((ex) =>
        formatExerciseSummary(ex, conversationMap.get(ex.conversationId) ?? null)
    );

    // 获取统计信息
    const stats = await speakingRepo.countCompletedSpeakingExercises(userId);

    const summary =
        stats.count > 0
            ? {
                  totalExercises: total,
                  completedExercises: stats.count,
                  averageFluency:
                      stats.averageFluency != null
                          ? Math.round(stats.averageFluency * 10) / 10
                          : null,
                  averageAccuracy:
                      stats.averageAccuracy != null
                          ? Math.round(stats.averageAccuracy * 10) / 10
                          : null,
                  highestFluency: stats.maxFluency ?? null,
                  lowestFluency: stats.minFluency ?? null,
              }
            : {
                  totalExercises: total,
                  completedExercises: 0,
                  averageFluency: null,
                  averageAccuracy: null,
                  highestFluency: null,
                  lowestFluency: null,
              };

    return {
        exercises,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary,
    };
}

// ==================== 删除口语练习 ====================

/**
 * 删除口语练习（软删除，级联删除会话和消息）
 * @param userId - 用户 ID
 * @param params - 删除参数（exerciseId）
 * @returns 已删除的练习 ID
 */
export async function deleteSpeakingExercise(
    userId: string,
    params: DeleteSpeakingExerciseInput
): Promise<{ id: string }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = deleteSpeakingExerciseSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { exerciseId } = parsedParams.data;

    const ex = await speakingRepo.findSpeakingExerciseById(exerciseId, userId);
    if (!ex) {
        throw new Error("练习不存在或无权访问");
    }

    // 删除关联的会话（会级联删除消息）
    await conversationService.deleteConversation(userId, { id: ex.conversationId });

    // 删除练习
    const result = await speakingRepo.deleteSpeakingExercise(exerciseId);

    return { id: result.id };
}
