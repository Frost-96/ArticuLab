import type { ScenarioType } from "@/schema/enums";

// ==================== 类型定义 ====================


export type ScenarioPrompt = {
    id: string;
    title: string;
    description: string;
    prompt: string;
    difficulty: string;
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
