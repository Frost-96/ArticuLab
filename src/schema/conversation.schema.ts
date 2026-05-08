import { z } from "zod";
import { conversationTypeEnum, messageRoleEnum } from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

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

// 获取会话列表
export const getConversationListSchema = z.object({
    type: conversationTypeEnum.optional(),
    ...paginationSchema.shape,
});

// 获取会话详情
export const getConversationSchema = z.object({
    id: idSchema,
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

// 更新消息
export const updateMessageSchema = z.object({
    id: idSchema,
    content: z
        .string()
        .min(1, "Message content cannot be empty")
        .optional(),
    audioUrl: z
        .union([z.url("Audio link format is incorrect"), z.null()])
        .optional(),
}).refine((data) => data.content !== undefined || data.audioUrl !== undefined, {
    message: "At least one message field must be provided",
});

// 删除消息
export const deleteMessageSchema = z.object({
    id: idSchema,
});

// ==================== 类型导出 ====================

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type GetConversationListInput = z.infer<
    typeof getConversationListSchema
>;
export type GetConversationInput = z.infer<typeof getConversationSchema>;
export type UpdateConversationTitleInput = z.infer<
    typeof updateConversationTitleSchema
>;
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
export type GetConversationMessagesInput = z.infer<
    typeof getConversationMessagesSchema
>;
export type SaveMessageInput = z.infer<typeof saveMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
