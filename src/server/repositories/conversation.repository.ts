// src/server/repositories/conversation.repository.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

// Select 模板定义 - 控制返回字段
const conversationSelect = {
    id: true,
    userId: true,
    type: true,
    title: true,
    scenarioId: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ConversationSelect;

// ==================== 查询会话列表 ====================

/**
 * 获取用户的会话列表（带分页）
 * @param userId - 用户 ID
 * @param type - 会话类型（可选：coach | writing | speaking）
 * @param skip - 跳过记录数
 * @param take - 获取记录数
 * @returns { rows: 会话列表，total: 总数 }
 */
export async function findConversations(params: {
    userId: string;
    type?: string;
    skip?: number;
    take?: number;
}) {
    const { userId, type, skip = 0, take = 10 } = params;

    const where: Record<string, unknown> = {
        userId,
        isDeleted: false,
        ...(type ? { type } : {}),
    };

    const [rows, total] = await Promise.all([
        prisma.conversation.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip,
            take,
            select: conversationSelect,
        }),
        prisma.conversation.count({ where }),
    ]);

    return { rows, total };
}

// ==================== 按 ID 查询会话 ====================

/**
 * 按 ID 查询会话
 * @param id - 会话 ID
 * @param userId - 用户 ID（用于权限校验）
 * @returns Conversation | null
 */
export async function findConversationById(
    id: string,
    userId: string
) {
    return prisma.conversation.findFirst({
        where: { id, userId, isDeleted: false },
        select: conversationSelect,
    });
}

// ==================== 创建会话 ====================

/**
 * 创建新会话
 * @param data - 会话数据
 * @returns 创建的会话
 */
export async function createConversation(data: {
    userId: string;
    type: string;
    title?: string | null;
    scenarioId?: string | null;
}) {
    return prisma.conversation.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            scenarioId: data.scenarioId,
        },
        select: conversationSelect,
    });
}

// ==================== 更新会话 ====================

/**
 * 更新会话标题
 * @param id - 会话 ID
 * @param title - 新标题
 * @returns 更新后的会话
 */
export async function updateConversationTitle(
    id: string,
    title: string
) {
    return prisma.conversation.update({
        where: { id },
        data: { title },
        select: conversationSelect,
    });
}

// ==================== 删除会话 ====================

/**
 * 删除会话（软删除）
 * @param id - 会话 ID
 * @returns 删除的会话 ID
 */
export async function deleteConversation(id: string) {
    return prisma.conversation.update({
        where: { id },
        data: {
            isDeleted: true as unknown as boolean,
        },
        select: { id: true },
    });
}


