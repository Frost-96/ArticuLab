// src/validators/coach.ts

import { z } from "zod";
import { idSchema } from "./shared.schema";

// ==================== AI 教练对话 ====================

// F-010: 发送文字消息（POST /api/chat）
export const chatMessageSchema = z.object({
    conversationId: idSchema.optional(), // 不传则创建新会话
    message: z
        .string()
        .min(1, "Message cannot be empty")
        .max(10000, "Message must not exceed 10000 characters"),
});

// F-012: 写作批改入口 — 当检测到长文本时自动切换
// 复用 chatMessageSchema，由 service 层判断是否进入批改模式

// F-014: 手动切换模式
export const switchModeSchema = z.object({
    conversationId: idSchema,
    mode: z.enum(["chat", "correct", "review", "qa"]),
});

// ==================== 类型导出 ====================

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type SwitchModeInput = z.infer<typeof switchModeSchema>;
