// src/types/conversation/conversationTypes.ts

import type { MessageData } from "@/types/message/messageTypes";

// ==================== 会话相关类型定义 ====================

export type ConversationSummary = {
    id: string;
    type: string;
    title: string | null;
    scenarioId: string | null;
    createdAt: string;
};

export type CreateConversationResult = {
    conversation: {
        id: string;
        type: string;
        title: string | null;
        scenarioId: string | null;
        createdAt: string;
    };
};

export type ConversationDetailWithMessages = {
    conversation: {
        id: string;
        userId: string;
        type: string;
        title: string | null;
        scenarioId: string | null;
        createdAt: string;
        updatedAt: string;
    };
    messages: MessageData[];
    hasMore?: boolean;
    nextCursor?: string;
};
