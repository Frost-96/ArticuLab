// src/server/services/message.service.ts

import * as messageRepo from "@/server/repositories/message.repository";
import { getFirstError } from "@/lib/error";
import { idSchema } from "@/schema/shared.schema";
import {
    saveMessageSchema,
    getConversationMessagesSchema,
    type SaveMessageInput,
    type GetConversationMessagesInput,
} from "@/schema/conversation.schema";
import type {
    MessageData,
    SaveMessageResult,
    GetMessagesResult,
} from "@/types/message/messageTypes";

// ==================== 辅助函数 ====================

/**
 * 格式化消息数据
 * @param msg - Repository 返回的消息对象
 * @returns 格式化后的消息数据
 */
function formatMessage(msg: Awaited<ReturnType<typeof messageRepo.createMessage>>): MessageData {
    return {
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        audioUrl: msg.audioUrl ?? null,
        createdAt: msg.createdAt.toISOString(),
    };
}

// ==================== 保存消息 ====================

/**
 * 保存单条消息
 * @param params - 消息参数（conversationId, role, content, audioUrl?）
 * @returns 保存的消息
 */
export async function saveMessage(
    params: SaveMessageInput
): Promise<SaveMessageResult> {
    const parsed = saveMessageSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { conversationId, role, content, audioUrl } = parsed.data;

    const msg = await messageRepo.createMessage({
        conversationId,
        role,
        content,
        audioUrl: audioUrl ?? null,
    });

    return {
        message: formatMessage(msg),
    };
}

// ==================== 批量保存消息 ====================

/**
 * 批量保存消息（用于保存一轮对话）
 * @param messages - 消息数组
 * @returns 保存的消息列表
 */
export async function saveManyMessages(
    messages: Array<{
        conversationId: string;
        role: string;
        content: string;
        audioUrl?: string;
    }>
): Promise<{ messages: MessageData[] }> {
    const created = await messageRepo.createManyMessages(messages);

    return {
        messages: created.map(formatMessage),
    };
}

// ==================== 获取会话消息 ====================

/**
 * 获取会话的消息列表（带游标分页）
 * @param params - 查询参数（conversationId, cursor?, limit?）
 * @returns 消息列表和分页信息
 */
export async function getConversationMessages(
    params: GetConversationMessagesInput
): Promise<GetMessagesResult> {
    const parsed = getConversationMessagesSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(getFirstError(parsed.error));
    }

    const { conversationId, cursor, limit } = parsed.data;

    const messages = await messageRepo.findMessagesByConversation({
        conversationId,
        cursor,
        limit: limit + 1, // 多取一条判断是否有更多
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;

    return {
        messages: resultMessages.map(formatMessage),
        hasMore,
        nextCursor: hasMore && resultMessages.length > 0 
            ? resultMessages[resultMessages.length - 1]?.id ?? undefined
            : undefined,
    };
}

// ==================== 获取最新消息 ====================

/**
 * 获取会话的最新 N 条消息
 * @param conversationId - 会话 ID
 * @param count - 消息数量
 * @returns 最新消息列表
 */
export async function getLatestMessages(
    conversationId: string,
    count: number
): Promise<{ messages: MessageData[] }> {
    const parsedId = idSchema.safeParse(conversationId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    // 获取所有消息后取最后 N 条（简单实现，可优化为倒序查询）
    const allMessages = await messageRepo.findMessagesByConversation({
        conversationId,
        limit: 1000, // 设置一个合理的上限
    });

    const latest = allMessages.slice(-count);

    return {
        messages: latest.map(formatMessage),
    };
}

// ==================== 删除消息 ====================

/**
 * 删除单条消息
 * @param messageId - 消息 ID
 * @returns 已删除的消息 ID
 */
export async function deleteMessage(
    messageId: string
): Promise<{ id: string }> {
    const parsedId = idSchema.safeParse(messageId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const result = await messageRepo.deleteMessage(messageId);
    return { id: result.id };
}

/**
 * 删除会话的所有消息
 * @param conversationId - 会话 ID
 * @returns 删除的消息数量
 */
export async function deleteAllMessages(
    conversationId: string
): Promise<{ count: number }> {
    const parsedId = idSchema.safeParse(conversationId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const result = await messageRepo.deleteMessagesByConversation(conversationId);
    return { count: result.count };
}
