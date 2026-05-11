// src/types/speaking/speakingTypes.ts

import type { SpeakingScenarioType, SpeakingExerciseStatus } from "@/schema/enums";
import type { SpeakingReviewResult } from "@/schema/speaking.schema";

// ==================== 口语练习相关类型定义 ====================

export type SpeakingExerciseSummary = {
    id: string;
    conversationId: string;
    title: string | null;
    scenarioType: SpeakingScenarioType;
    scenarioRole: string;
    status: SpeakingExerciseStatus;
    totalTurns: number | null;
    durationSeconds: number | null;
    fluencyScore: number | null;
    accuracyScore: number | null;
    createdAt: string;
    completedAt: string | null;
};

export type SpeakingExerciseDetail = {
    id: string;
    userId: string;
    scenarioType: SpeakingScenarioType;
    scenarioRole: string;
    conversationId: string;
    status: SpeakingExerciseStatus;
    totalTurns: number | null;
    durationSeconds: number | null;
    scores: {
        fluency: number | null;
        accuracy: number | null;
    } | null;
    feedback: SpeakingReviewResult | null;
    scenarioId: string | null;
    createdAt: string;
    completedAt: string | null;
};

export type SpeakingHistoryResult = {
    exercises: SpeakingExerciseSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        totalExercises: number;
        completedExercises: number;
        averageFluency: number | null;
        averageAccuracy: number | null;
        highestFluency: number | null;
        lowestFluency: number | null;
    };
};

export type StartSpeakingResult = {
    exerciseId: string;
    conversationId: string;
    scenarioType: SpeakingScenarioType;
    scenarioRole: string;
    status: 'in_progress';
    createdAt: string;
};

export type SpeakingChatResult = {
    userMessageId: string;
    userMessage: string;
    assistantMessageId: string;
    assistantResponse: string;
    assistantAudioUrl?: string | null;
    turnNumber: number;
};

export type EndSpeakingResult = {
    exerciseId: string;
    status: 'completed';
    totalTurns: number;
    durationSeconds: number;
    fluencyScore: number;
    accuracyScore: number;
    feedback: SpeakingReviewResult;
    completedAt: string;
};
