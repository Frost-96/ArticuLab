import type {
    SpeakingExerciseStatus,
    SpeakingReviewResult,
    SpeakingScenarioType,
} from "@/schema";

export type SpeakingHistoryItem = {
    id: string;
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
