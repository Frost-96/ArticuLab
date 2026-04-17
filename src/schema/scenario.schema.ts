import { z } from "zod";
import {
    scenarioCategoryEnum,
    scenarioTypeEnum,
    difficultyEnum,
} from "./enums";
import { paginationSchema } from "./shared.schema";

// ==================== 场景相关 ====================

// 获取场景列表（筛选）
export const getScenarioListSchema = z.object({
    category: scenarioCategoryEnum, // writing / speaking
    scenarioType: scenarioTypeEnum.optional(),
    difficulty: difficultyEnum.optional(),
    ...paginationSchema.shape,
});

// 创建场景（管理用途 / 种子数据）
export const createScenarioSchema = z.object({
    type: scenarioCategoryEnum,
    category: scenarioTypeEnum,
    title: z
        .string()
        .min(1, "Title cannot be empty")
        .max(200, "Title must not exceed 200 characters"),
    description: z
        .string()
        .min(1, "Description cannot be empty")
        .max(2000, "Description must not exceed 2000 characters"),
    prompt: z
        .string()
        .min(1, "Prompt cannot be empty")
        .max(5000, "Content must not exceed 5000 characters"),
    aiRole: z
        .string()
        .max(500, "AI role description must not exceed 500 characters")
        .optional(),
    difficulty: difficultyEnum,
    isGenerated: z.boolean().default(false),
});

// ==================== 类型导出 ====================

export type GetScenarioListInput = z.infer<typeof getScenarioListSchema>;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
