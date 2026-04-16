// src/validators/conversation.ts

import { z } from "zod";
import { conversationTypeEnum, messageRoleEnum } from "./enums";
import { idSchema } from "./shared";

// ==================== 会话相关 ====================

// 创建新会话
export const createConversationSchema = z.object({
    type: conversationTypeEnum,
    title: z
        .string()
        .max(100, "Title must not exceed 100 characters")
        .optional(),
    scenarioId: idSchema.optional(),
});

// 更新会话标题
export const updateConversationTitleSchema = z.object({
    id: idSchema,
    title: z
        .string()
        .min(1, "Title cannot be empty")
        .max(100, "Title must not exceed 100 characters"),
});

// 删除会话
export const deleteConversationSchema = z.object({
    id: idSchema,
});

// 获取会话消息列表
export const getConversationMessagesSchema = z.object({
    conversationId: idSchema,
    cursor: idSchema.optional(), // 游标分页
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ==================== 消息相关 ====================

// 保存消息（SSE 流结束后调用）
export const saveMessageSchema = z.object({
    conversationId: idSchema,
    role: messageRoleEnum,
    content: z.string().min(1, "Message content cannot be empty"),
    audioUrl: z.url("Audio link format is incorrect").optional(),
});

// ==================== 类型导出 ====================

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationTitleInput = z.infer<
    typeof updateConversationTitleSchema
>;
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
export type GetConversationMessagesInput = z.infer<
    typeof getConversationMessagesSchema
>;
export type SaveMessageInput = z.infer<typeof saveMessageSchema>;
