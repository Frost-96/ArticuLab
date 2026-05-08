import type { Difficulty, ScenarioCategory, ScenarioType } from "@/schema/enums";

// ==================== 类型定义 ====================


export type ScenarioPrompt = {
    id: string;
    type: ScenarioCategory;
    title: string;
    description: string;
    prompt: string;
    aiRole: string | null;
    difficulty: Difficulty;
    estimatedWords: number;
    estimatedMinutes: number;
    category: ScenarioType;
    createdAt: string;
};

export type ScenarioListResult = {
    prompts: ScenarioPrompt[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
