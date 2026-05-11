// src/server/repositories/message.repository.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

// Select 模板定义 - 控制返回字段
const messageSelect = {
    id: true,
    conversationId: true,
    role: true,
    content: true,
    audioUrl: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.MessageSelect;

// ==================== 查询消息列表 ====================

/**
 * 获取会话的消息列表（带游标分页）
 * @param conversationId - 会话 ID
 * @param cursor - 游标 ID（可选，用于分页）
 * @param limit - 获取记录数
 * @returns 消息列表
 */
export async function findMessagesByConversation(params: {
    conversationId: string;
    cursor?: string;
    limit: number;
}) {
    const { conversationId, cursor, limit = 20 } = params;

    const where: Record<string, unknown> = {
        conversationId,
        isDeleted: false,
        ...(cursor ? { id: { gt: cursor } } : {}),
    };

    const messages = await prisma.message.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: limit,
        select: messageSelect,
    });

    return messages;
}

// ==================== 创建消息 ====================

/**
 * 创建新消息
 * @param data - 消息数据
 * @returns 创建的消息
 */
export async function createMessage(data: {
    conversationId: string;
    role: string;
    content: string;
    audioUrl?: string | null;
}) {
    return prisma.message.create({
        data: {
            conversationId: data.conversationId,
            role: data.role,
            content: data.content,
            audioUrl: data.audioUrl,
        },
        select: messageSelect,
    });
}

// ==================== 批量创建消息 ====================

/**
 * 批量创建消息（用于保存一轮对话）
 * @param messages - 消息数组
 * @returns 创建的消息列表
 */
export async function createManyMessages(
    messages: Array<{
        conversationId: string;
        role: string;
        content: string;
        audioUrl?: string | null;
    }>
) {
    const created = await prisma.$transaction(
        messages.map((msg) =>
            prisma.message.create({
                data: {
                    conversationId: msg.conversationId,
                    role: msg.role as Prisma.MessageCreateInput["role"],
                    content: msg.content,
                    audioUrl: msg.audioUrl,
                },
                select: messageSelect,
            })
        )
    );

    return created;
}

// ==================== 统计会话消息数 ====================

/**
 * 统计会话的消息数量
 * @param conversationId - 会话 ID
 * @returns 消息总数
 */
export async function countMessagesByConversation(
    conversationId: string
) {
    return prisma.message.count({
        where: {
            conversationId,
            isDeleted: false,
        },
    });
}

// ==================== 删除消息 ====================

/**
 * 删除单条消息（软删除）
 * @param id - 消息 ID
 * @returns 删除的消息 ID
 */
export async function deleteMessage(id: string) {
    return prisma.message.update({
        where: { id },
        data: {
            isDeleted: true as unknown as boolean,
        },
        select: { id: true },
    });
}

/**
 * 批量删除会话的所有消息（软删除）
 * @param conversationId - 会话 ID
 * @returns 删除的消息数量
 */
export async function deleteMessagesByConversation(
    conversationId: string
) {
    const result = await prisma.message.updateMany({
        where: {
            conversationId,
            isDeleted: false,
        },
        data: {
            isDeleted: true as unknown as boolean,
        },
    });

    return { count: result.count };
}


