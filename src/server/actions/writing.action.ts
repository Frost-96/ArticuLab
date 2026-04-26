// src/server/actions/writing.action.ts
"use server";

import * as writingService from "@/server/services/writing.service";
import {
    createWritingExerciseSchema,
    getWritingExerciseSchema,
    deleteWritingExerciseSchema,
    getWritingHistorySchema,
    getDraftSchema,
    saveDraftSchema,
    submitWritingSchema,
    type CreateWritingExerciseInput,
    type GetWritingHistoryInput,
    type GetWritingExerciseInput,
    type DeleteWritingExerciseInput,
    type GetDraftInput,
    type SaveDraftInput,
    type SubmitWritingInput,
} from "@/schema/writing.schema";
import type { ActionResult } from "@/schema/shared.schema";
import { getFirstError } from "@/lib/error";
import { getCurrentUser } from "@/lib/auth";
import type { WritingResult, WritingExerciseDetail, DraftData, WritingHistoryResult, SubmitWritingResult } from "@/types/writing/writingTypes"

// ==================== 获取写作练习列表 ====================

/**
 * 获取写作练习历史（带分页和统计）
 * @param input - 筛选和分页参数
 * @returns ActionResult<WritingHistoryResult>
 */
export async function getWritingHistoryAction(
    input: GetWritingHistoryInput
): Promise<
    ActionResult<WritingHistoryResult>
> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getWritingHistorySchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.getWritingHistory(user.userId, parsed.data);

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get writing history",
        };
    }
}

// ==================== 创建写作练习 ====================

/**
 * 创建写作练习
 * @param input - 创建参数
 * @returns ActionResult<WritingExerciseDetail>
 */
export async function createWritingExerciseAction(
    input: CreateWritingExerciseInput
): Promise<
    ActionResult<{
        exercise: WritingExerciseDetail
    }>
> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = createWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3.调用service层
        const result = await writingService.createWritingExercise(user.userId,parsed.data);

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create writing exercise",
        };
    }
}

// ==================== 获取写作练习详情 ====================

/**
 * 获取写作练习详情
 * @param input - 练习 ID
 * @returns ActionResult<WritingExerciseDetail>
 */
export async function getWritingExerciseAction(
    input: GetWritingExerciseInput
): Promise<
    ActionResult<{
        exercise: WritingExerciseDetail
    }>
> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.getWritingExercise(user.userId, parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get writing exercise",
        };
    }
}

// ==================== 删除写作练习 ====================

/**
 * 删除写作练习
 * @param input - 练习 ID
 * @returns ActionResult<{ id: string }>
 */
export async function deleteWritingExerciseAction(
    input: DeleteWritingExerciseInput
): Promise<ActionResult<{ id: string }>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = deleteWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.deleteWritingExercise(user.userId, parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete writing exercise",
        };
    }
}

// ==================== 获取草稿 ====================

/**
 * 获取写作草稿
 * @param input - 练习 ID
 * @returns ActionResult<DraftData>
 */
export async function getDraftAction(
    input: GetDraftInput
): Promise<ActionResult<{draft: DraftData}>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getDraftSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.getDraft(user.userId, parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get draft",
        };
    }
}

// ==================== 保存草稿 ====================

/**
 * 保存写作草稿
 * @param input - 草稿数据
 * @returns ActionResult<DraftData>
 */
export async function saveDraftAction(
    input: SaveDraftInput
): Promise< ActionResult<{draft: DraftData}>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = saveDraftSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.saveDraft(user.userId,parsed.data);

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to save draft",
        };
    }
}

// ==================== 提交写作批改 ====================

/**
 * 提交写作进行 AI 批改
 * @param input - 提交参数（包含 exerciseId）
 * @returns ActionResult<SubmitWritingResult>
 * 提交内容中的scenarioType和isCustomPrompt必须与 exerciseId 对应的记录一致
 * 目前的逻辑是只在创建作文记录时设置scenarioType、isCustomPrompt、scenarioId，之后不可变更
 */
export async function submitWritingAction(
    input: SubmitWritingInput
): Promise<ActionResult<{result: SubmitWritingResult;}>> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        const parsed = submitWritingSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }
/* 
        if (!input.exerciseId) {
            return { success: false, error: "exerciseId 必填" };
        } */

        // 2. 使用从 Session 中获取的真实 userId
        const result = await writingService.submitWriting(user.userId, parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to submit writing",
        };
    }
}

// ==================== 获取批改结果 ====================

/**
 * 获取 AI 批改结果
 * @param input - 练习 ID
 * @returns ActionResult<WritingResult>
 */
export async function getWritingResultAction(
    input: GetWritingExerciseInput
): Promise<
    ActionResult<WritingResult>
> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.getWritingResult(user.userId, parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get writing result",
        };
    }
}

// ==================== 获取改进建议 ====================

/**
 * 获取批改生成的改进建议与参考范文
 * @param input - 练习 ID
 * @returns ActionResult<WritingSuggestions>
 */
/* export async function getWritingSuggestionsAction(
    input: GetWritingExerciseInput
): Promise<
    ActionResult<Awaited<ReturnType<typeof writingService.getWritingSuggestions>>>
> {
    try {
        // 1. 鉴权：获取当前登录用户
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 校验
        const parsed = getWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 使用从 Session 中获取的真实 userId
        const result = await writingService.getWritingSuggestions(user.userId, parsed.data.exerciseId);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get writing suggestions",
        };
    }
}
 */