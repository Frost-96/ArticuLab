// src/server/services/conversation.service.ts

import * as conversationRepo from "@/server/repositories/conversation.repository";
import * as messageService from "./message.service";
import { getFirstError } from "@/lib/error";
import { idSchema } from "@/schema/shared.schema";
import {
    createConversationSchema,
    getConversationMessagesSchema,
    updateConversationTitleSchema,
    deleteConversationSchema,
    type CreateConversationInput,
    type GetConversationMessagesInput,
    type UpdateConversationTitleInput,
    type DeleteConversationInput,
} from "@/schema/conversation.schema";
import type { MessageData } from "@/types/message/messageTypes";
import type {
    ConversationSummary,
    CreateConversationResult,
    ConversationDetailWithMessages,
} from "@/types/conversation/conversationTypes";

// ==================== 辅助函数 ====================

/**
 * 格式化会话数据
 * @param conv - Repository 返回的会话对象
 * @returns 格式化后的会话摘要
 */
function formatConversationSummary(conv: { 
    id: string; 
    type: string; 
    title: string | null; 
    scenarioId: string | null; 
    createdAt: Date;
}): ConversationSummary {
    return {
        id: conv.id,
        type: conv.type,
        title: conv.title ?? null,
        scenarioId: conv.scenarioId ?? null,
        createdAt: conv.createdAt.toISOString(),
    };
}

/**
 * 格式化会话详情
 * @param conv - Repository 返回的会话对象
 * @returns 格式化后的会话详情
 */
function formatConversationDetail(conv: NonNullable<Awaited<ReturnType<typeof conversationRepo.findConversationById>>>) {
    return {
        id: conv.id,
        userId: conv.userId,
        type: conv.type,
        title: conv.title ?? null,
        scenarioId: conv.scenarioId ?? null,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: (conv.updatedAt as Date).toISOString(),
    };
}

// ==================== 创建会话 ====================

/**
 * 创建新会话
 * @param userId - 用户 ID
 * @param params - 创建参数（type, title?, scenarioId?）
 * @returns 创建的会话
 */
export async function createConversation(
    userId: string,
    params: CreateConversationInput
): Promise<CreateConversationResult> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsed = createConversationSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { type, title, scenarioId } = parsed.data;

    const conv = await conversationRepo.createConversation({
        userId,
        type,
        title: title ?? null,
        scenarioId: scenarioId ?? null,
    });

    return {
        conversation: {
            id: conv.id,
            type: conv.type,
            title: conv.title ?? null,
            scenarioId: conv.scenarioId ?? null,
            createdAt: conv.createdAt.toISOString(),
        },
    };
}

// ==================== 获取会话列表 ====================

/**
 * 获取用户的会话列表（带分页）
 * @param userId - 用户 ID
 * @param params - 筛选和分页参数
 * @returns 会话列表和分页信息
 */
export async function getUserConversations(
    userId: string,
    params: {
        type?: string;
        page: number;
        limit: number;
    }
): Promise<{
    conversations: ConversationSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const { type, page, limit } = params;
    const skip = (page - 1) * limit;

    const { rows, total } = await conversationRepo.findConversations({
        userId,
        type,
        skip,
        take: limit,
    });

    const conversations = rows.map(formatConversationSummary);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        conversations,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}

// ==================== 获取会话详情（含消息）====================

/**
 * 获取会话详情及消息列表（支持分页）
 * @param userId - 用户 ID
 * @param params - 查询参数（conversationId, cursor?, limit?）
 * @returns 会话详情和消息列表
 */
export async function getConversationDetail(
    userId: string,
    params: GetConversationMessagesInput
): Promise<ConversationDetailWithMessages> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsed = getConversationMessagesSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { conversationId, cursor, limit } = parsed.data;

    // 验证会话所有权
    const conv = await conversationRepo.findConversationById(conversationId, userId);
    if (!conv) {
        throw new Error("会话不存在或无权访问");
    }

    // 获取会话的消息（支持分页）
    const { messages, hasMore, nextCursor } = await messageService.getConversationMessages({
        conversationId,
        cursor,
        limit,
    });

    return {
        conversation: {
            id: conv.id,
            userId: conv.userId,
            type: conv.type,
            title: conv.title ?? null,
            scenarioId: conv.scenarioId ?? null,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: (conv.updatedAt as Date).toISOString(),
        },
        messages,
        hasMore,
        nextCursor,
    };
}

// ==================== 更新会话标题 ====================

/**
 * 更新会话标题
 * @param userId - 用户 ID
 * @param params - 更新参数（id, title）
 * @returns 更新后的会话
 */
export async function updateConversationTitle(
    userId: string,
    params: UpdateConversationTitleInput
): Promise<{
    conversation: {
        id: string;
        title: string;
    };
}> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsed = updateConversationTitleSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { id: conversationId, title } = parsed.data;

    // 验证会话所有权
    const conv = await conversationRepo.findConversationById(conversationId, userId);
    if (!conv) {
        throw new Error("会话不存在或无权访问");
    }

    const updated = await conversationRepo.updateConversationTitle(conversationId, title);

    return {
        conversation: {
            id: updated.id,
            title: updated.title ?? title,
        },
    };
}

// ==================== 删除会话 ====================

/**
 * 删除会话（软删除，级联删除消息）
 * @param userId - 用户 ID
 * @param params - 删除参数（id）
 * @returns 已删除的会话 ID
 */
export async function deleteConversation(
    userId: string,
    params: DeleteConversationInput
): Promise<{ id: string }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsed = deleteConversationSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { id: conversationId } = parsed.data;

    // 验证会话所有权
    const conv = await conversationRepo.findConversationById(conversationId, userId);
    if (!conv) {
        throw new Error("会话不存在或无权访问");
    }

    // 先删除所有消息
    await messageService.deleteAllMessages(conversationId);

    // 再删除会话
    const result = await conversationRepo.deleteConversation(conversationId);

    return { id: result.id };
}
