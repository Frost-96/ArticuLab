import type React from "react";
import type { Prisma } from "../../generated/prisma/client";

// UI 导航
export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}

// AI 教练前端渲染用消息（含 corrections，不直接对应数据库 Message）
export interface ChatMessageDisplay {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    corrections?: Array<{
        original: string;
        corrected: string;
        explanation: string;
    }>;
}

// 会话列表项（带最后一条消息的聚合查询结果）
export type ConversationListItem = Prisma.ConversationGetPayload<{
    include: { messages: { take: 1; orderBy: { createdAt: "desc" } } };
}>;

export * from "./onboarding";
export * from "./speaking/speakingTypes";
export * from "./conversation/conversationTypes";
export * from "./message/messageTypes";
