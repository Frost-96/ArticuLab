// src/types/message/messageTypes.ts

// ==================== 消息相关类型定义 ====================

export type MessageData = {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    audioUrl: string | null;
    createdAt: string;
};

export type SaveMessageResult = {
    message: MessageData;
};

export type GetMessagesResult = {
    messages: MessageData[];
    hasMore: boolean;
    nextCursor?: string;
};
