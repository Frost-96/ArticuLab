import  { type WritingExerciseStatus , type WritingReviewResult , type WritingScenarioType , writingReviewResultSchema} from "@/schema";

// ==================== 类型定义 ====================

export type WritingExerciseSummary = {
    id: string;
    scenarioType: WritingScenarioType;
    prompt: string;
    wordCount: number;
    overallScore: number | null;
    status: WritingExerciseStatus;
    createdAt: string;
    evaluatedAt: string | null;
};

export type WritingExerciseDetail = {
    id: string;
    userId: string;
    scenarioType: WritingScenarioType;
    prompt: string;
    isCustomPrompt: boolean;
    content: string;
    wordCount: number;
    status: WritingExerciseStatus;
    scores: {
        overall: number | null;
        grammar: number | null;
        vocabulary: number | null;
        coherence: number | null;
        taskCompletion: number | null;
    } | null;
    /* feedback: {
        summary: string;
        issues: Array<{
            id: number;
            type: "error" | "suggestion" | "enhancement";
            severity: "high" | "medium" | "low";
            sentence: string;
            correction: string;
            explanation: string;
            position: { start: number; end: number };
            category?: string;
        }>;
    } | null; */
    feedback: WritingReviewResult | null;
    scenarioId: string | null;
    createdAt: string;
    evaluatedAt: string | null;
};

export type DraftData = {
    id: string;
    content: string;
    wordCount: number;
    status: WritingExerciseStatus;
    lastSavedAt: string;
};

export type WritingHistoryResult = {
    exercises: WritingExerciseSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        totalExercises: number;
        completedExercises: number;
        averageScore: number | null;
        highestScore: number | null;
        lowestScore: number | null;
    };
};

export type SubmitWritingResult = {
    id: string;
    status: "completed";
    message: string;
    estimatedWaitTime: number;
    submittedAt: string;
    evaluatedAt: string;
    data: WritingReviewResult;
};

export type WritingResult = {
    id: string;
    status: "completed";
    feedback: WritingReviewResult;
    createdAt: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
    updatedAt: string;
}

export type AssessInput = {
  scenarioType: WritingScenarioType;
  prompt: string;
  content: string;
  wordCount: number;
  description?: string; // 题目的详细描述（可选，从scenario中获取）
};