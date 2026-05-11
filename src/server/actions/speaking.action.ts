// src/server/actions/speaking.action.ts
"use server";

import * as speakingService from "@/server/services/speaking.service";
import * as conversationService from "@/server/services/conversation.service";
import type { ConversationDetailWithMessages } from "@/types/conversation/conversationTypes";

import {
    startSpeakingSchema,
    speakingChatSchema,
    endSpeakingSchema,
    getSpeakingExerciseSchema,
    getSpeakingMessagesSchema,
    getSpeakingHistorySchema,
    deleteSpeakingExerciseSchema,
    type StartSpeakingInput,
    type SpeakingChatInput,
    type EndSpeakingInput,
    type GetSpeakingExerciseInput,
    type GetSpeakingMessagesInput,
    type GetSpeakingHistoryInput,
    type DeleteSpeakingExerciseInput,
} from "@/schema/speaking.schema";
import type { ActionResult } from "@/schema/shared.schema";
import { getFirstError } from "@/lib/error";
import { getCurrentUser } from "@/lib/auth";
import type {
    SpeakingExerciseSummary,
    SpeakingExerciseDetail,
    SpeakingHistoryResult,
    StartSpeakingResult,
    SpeakingChatResult,
    EndSpeakingResult,
} from "@/types/speaking/speakingTypes";

// ==================== 开始口语练习 ====================

/**
 * 开始口语练习 Action
 * @param input - { scenarioId } 或 { scenarioCategory, title, aiRole }
 * @returns ActionResult<StartSpeakingResult>
 */
export async function startSpeakingAction(
    input: StartSpeakingInput
): Promise<ActionResult<{ exercise: StartSpeakingResult }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = startSpeakingSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId，传递完整的解析后数据
        const result = await speakingService.startSpeakingExercise(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to start speaking exercise",
        };
    }
}

// ==================== 口语对话交互 ====================

/**
 * 口语对话 Action
 * @param input - { exerciseId, conversationId, message }
 * @returns ActionResult<SpeakingChatResult>
 */
export async function speakingChatAction(
    input: SpeakingChatInput
): Promise<ActionResult<{ chat: SpeakingChatResult }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = speakingChatSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await speakingService.processSpeakingChat(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process speaking chat",
        };
    }
}

// ==================== 结束口语练习 ====================

/**
 * 结束口语练习 Action
 * @param input - { exerciseId }
 * @returns ActionResult<EndSpeakingResult>
 */
export async function endSpeakingAction(
    input: EndSpeakingInput
): Promise<ActionResult<{ result: EndSpeakingResult }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = endSpeakingSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await speakingService.endSpeakingExercise(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to end speaking exercise",
        };
    }
}

// ==================== 获取口语练习详情 ====================

/**
 * 获取口语练习详情 Action
 * @param input - { id }
 * @returns ActionResult<SpeakingExerciseDetail>
 */
export async function getSpeakingExerciseAction(
    input: GetSpeakingExerciseInput
): Promise<ActionResult<{ exercise: SpeakingExerciseDetail }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getSpeakingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await speakingService.getSpeakingExerciseDetail(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get speaking exercise",
        };
    }
}

// ==================== 获取口语练习历史 ====================

/**
 * 获取口语练习历史 Action
 * @param input - { scenarioType?, page, pageSize }
 * @returns ActionResult<SpeakingHistoryResult>
 */
export async function getSpeakingHistoryAction(
    input: GetSpeakingHistoryInput
): Promise<ActionResult<SpeakingHistoryResult>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getSpeakingHistorySchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await speakingService.getSpeakingHistory(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get speaking history",
        };
    }
}

// ==================== 删除口语练习 ====================

/**
 * 删除口语练习 Action
 * @param input - { exerciseId }
 * @returns ActionResult<{ id: string }>
 */
export async function deleteSpeakingExerciseAction(
    input: DeleteSpeakingExerciseInput
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = deleteSpeakingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await speakingService.deleteSpeakingExercise(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete speaking exercise",
        };
    }
}

// ==================== 获取口语练习会话消息（支持分页）====================

/**
 * 获取口语练习会话消息 Action（支持游标分页）
 * @param input - { conversationId, cursor?, limit? }
 * @returns ActionResult<ConversationDetailWithMessages>
 */
export async function getSpeakingMessagesAction(
    input: GetSpeakingMessagesInput
): Promise<ActionResult<ConversationDetailWithMessages>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getSpeakingMessagesSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用 conversationService 获取会话详情和消息（内部会验证所有权）
        const result = await conversationService.getConversationDetail(
            user.userId,
            parsed.data
        );

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get messages",
        };
    }
}
