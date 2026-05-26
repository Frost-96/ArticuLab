// src/types/message/messageTypes.ts

import type { PronunciationResultLite } from "@/schema/speaking.schema";

// ==================== 消息相关类型定义 ====================

export type MessageData = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  audioUrl: string | null;
  createdAt: string;
  // 发音评估（仅 user 消息有值）
  pronunciationScore?: number | null;
  pronunciationAccuracy?: number | null;
  pronunciationFluency?: number | null;
  pronunciationCompleteness?: number | null;
  pronunciationProsody?: number | null;
  // 完整发音评估结果（含逐词+音素数据）
  pronunciationFeedback?: PronunciationResultLite | null;
};

export type SaveMessageResult = {
  message: MessageData;
};

export type GetMessagesResult = {
  messages: MessageData[];
  hasMore: boolean;
  nextCursor?: string;
};
