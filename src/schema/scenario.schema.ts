import { z } from "zod";
import {
    scenarioCategoryEnum,
    scenarioTypeEnum,
    difficultyEnum,
} from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

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

// 获取单个场景
export const getScenarioSchema = z.object({
    id: idSchema,
});

// 更新场景（内部管理/种子数据使用）
export const updateScenarioSchema = z
    .object({
        id: idSchema,
        type: scenarioCategoryEnum.optional(),
        category: scenarioTypeEnum.optional(),
        title: z
            .string()
            .min(1, "Title cannot be empty")
            .max(200, "Title must not exceed 200 characters")
            .optional(),
        description: z
            .string()
            .min(1, "Description cannot be empty")
            .max(2000, "Description must not exceed 2000 characters")
            .optional(),
        prompt: z
            .string()
            .min(1, "Prompt cannot be empty")
            .max(5000, "Content must not exceed 5000 characters")
            .optional(),
        aiRole: z
            .string()
            .max(500, "AI role description must not exceed 500 characters")
            .nullable()
            .optional(),
        difficulty: difficultyEnum.optional(),
        isGenerated: z.boolean().optional(),
    })
    .refine(
        (data) =>
            data.type !== undefined ||
            data.category !== undefined ||
            data.title !== undefined ||
            data.description !== undefined ||
            data.prompt !== undefined ||
            data.aiRole !== undefined ||
            data.difficulty !== undefined ||
            data.isGenerated !== undefined,
        {
            message: "At least one scenario field must be provided",
        },
    );

// 删除场景（软删除）
export const deleteScenarioSchema = z.object({
    id: idSchema,
});

// ==================== 类型导出 ====================

export type GetScenarioListInput = z.infer<typeof getScenarioListSchema>;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type GetScenarioInput = z.infer<typeof getScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export type DeleteScenarioInput = z.infer<typeof deleteScenarioSchema>;
