import type {
  SpeakingExerciseStatus,
  SpeakingReviewResult,
  SpeakingScenarioType,
} from "@/schema";

/** 轻量级练习访问信息（用于验证后的上下文传递） */
export type ExerciseAccessInfo = {
  id: string;
  conversationId: string;
  scenarioType: SpeakingScenarioType;
  scenarioRole: string;
  status: SpeakingExerciseStatus;
  title: string;
  prompt: string;
  description: string;
  aiRole: string;
  createdAt: string;
};

export type SpeakingHistoryItem = {
  id: string;
  conversationId: string;
  title: string;
  scenarioType: SpeakingScenarioType;
  scenarioRole: string;
  status: SpeakingExerciseStatus;
  totalTurns: number;
  durationSeconds: number;
  fluencyScore: number | null;
  accuracyScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SpeakingHistoryResult = {
  exercises: SpeakingHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SpeakingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl: string | null;
  createdAt: string;
  // 发音评估分数（仅 user 消息有值）
  pronunciationScore?: number | null;
  pronunciationAccuracy?: number | null;
  pronunciationFluency?: number | null;
  pronunciationCompleteness?: number | null;
  pronunciationProsody?: number | null;
};

export type SpeakingExerciseDetail = {
  id: string;
  conversationId: string;
  scenarioId: string | null;
  title: string;
  prompt: string;
  description: string;
  aiRole: string;
  scenarioType: SpeakingScenarioType;
  status: SpeakingExerciseStatus;
  totalTurns: number;
  durationSeconds: number;
  fluencyScore: number | null;
  accuracyScore: number | null;
  feedback: SpeakingReviewResult | null;
  createdAt: string;
  updatedAt: string;
  messages: SpeakingMessage[];
};

export type StartSpeakingResult = {
  exercise: SpeakingExerciseDetail;
};

export type SaveSpeakingMessageResult = {
  message: SpeakingMessage;
  totalTurns: number;
};
