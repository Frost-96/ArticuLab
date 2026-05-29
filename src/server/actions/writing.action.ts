// src/server/actions/writing.action.ts
"use server";

import * as writingService from "@/server/services/writing.service";
import {
  createWritingExerciseSchema,
  getWritingExerciseSchema,
  deleteWritingExerciseSchema,
  renameWritingExerciseSchema,
  getWritingHistorySchema,
  getDraftSchema,
  saveDraftSchema,
  submitWritingSchema,
  type CreateWritingExerciseInput,
  type GetWritingHistoryInput,
  type GetWritingExerciseInput,
  type DeleteWritingExerciseInput,
  type RenameWritingExerciseInput,
  type GetDraftInput,
  type SaveDraftInput,
  type SubmitWritingInput,
} from "@/schema/writing.schema";
import type { ActionResult } from "@/schema/shared.schema";
import { getFirstError } from "@/lib/error";
import { getCurrentUser } from "@/lib/auth";
import type {
  WritingResult,
  WritingExerciseDetail,
  DraftData,
  WritingHistoryResult,
  SubmitWritingResult,
} from "@/types/writing/writingTypes";

// ==================== 鑾峰彇鍐欎綔缁冧範鍒楄〃 ====================

/**
 * 鑾峰彇鍐欎綔缁冧範鍘嗗彶锛堝甫鍒嗛〉鍜岀粺璁★級
 * @param input - 绛涢€夊拰鍒嗛〉鍙傛暟
 * @returns ActionResult<WritingHistoryResult>
 */
export async function getWritingHistoryAction(
  input: GetWritingHistoryInput,
): Promise<ActionResult<WritingHistoryResult>> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = getWritingHistorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.getWritingHistory(
      user.userId,
      parsed.data,
    );

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get writing history",
    };
  }
}

// ==================== 鍒涘缓鍐欎綔缁冧範 ====================

/**
 * 鍒涘缓鍐欎綔缁冧範
 * @param input - 鍒涘缓鍙傛暟
 * @returns ActionResult<WritingExerciseDetail>
 */
export async function createWritingExerciseAction(
  input: CreateWritingExerciseInput,
): Promise<
  ActionResult<{
    exercise: WritingExerciseDetail;
  }>
> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = createWritingExerciseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3.璋冪敤service灞?
    const result = await writingService.createWritingExercise(
      user.userId,
      parsed.data,
    );

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create writing exercise",
    };
  }
}

// ==================== 鑾峰彇鍐欎綔缁冧範璇︽儏 ====================

/**
 * 鑾峰彇鍐欎綔缁冧範璇︽儏
 * @param input - 缁冧範 ID
 * @returns ActionResult<WritingExerciseDetail>
 */
export async function getWritingExerciseAction(
  input: GetWritingExerciseInput,
): Promise<
  ActionResult<{
    exercise: WritingExerciseDetail;
  }>
> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = getWritingExerciseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.getWritingExercise(
      user.userId,
      parsed.data,
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get writing exercise",
    };
  }
}

// ==================== 鍒犻櫎鍐欎綔缁冧範 ====================

/**
 * 鍒犻櫎鍐欎綔缁冧範
 * @param input - 缁冧範 ID
 * @returns ActionResult<{ id: string }>
 */
export async function deleteWritingExerciseAction(
  input: DeleteWritingExerciseInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = deleteWritingExerciseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.deleteWritingExercise(
      user.userId,
      parsed.data,
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete writing exercise",
    };
  }
}

// ==================== 鑾峰彇鑽夌 ====================

/**
 * 鑾峰彇鍐欎綔鑽夌
 * @param input - 缁冧範 ID
 * @returns ActionResult<DraftData>
 */
export async function getDraftAction(
  input: GetDraftInput,
): Promise<ActionResult<{ draft: DraftData }>> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = getDraftSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.getDraft(user.userId, parsed.data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get draft",
    };
  }
}

// ==================== 淇濆瓨鑽夌 ====================

/**
 * 淇濆瓨鍐欎綔鑽夌
 * @param input - 鑽夌鏁版嵁
 * @returns ActionResult<DraftData>
 */
export async function saveDraftAction(
  input: SaveDraftInput,
): Promise<ActionResult<{ draft: DraftData }>> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = saveDraftSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.saveDraft(user.userId, parsed.data);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save draft",
    };
  }
}

export async function renameWritingExerciseAction(
  input: RenameWritingExerciseInput,
): Promise<ActionResult<{ exercise: WritingExerciseDetail }>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = renameWritingExerciseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    const result = await writingService.renameWritingExercise(
      user.userId,
      parsed.data,
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to rename writing exercise",
    };
  }
}

// Deprecated: use POST /api/writing/submit instead.
// Kept for backward compatibility with the test page.
export async function submitWritingAction(
  input: SubmitWritingInput,
): Promise<ActionResult<{ result: SubmitWritingResult }>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = submitWritingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    const saveResult = await writingService.submitWritingForReview(
      user.userId,
      parsed.data,
    );

    return { success: true, data: saveResult };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit writing",
    };
  }
}

// ==================== 鑾峰彇鎵规敼缁撴灉 ====================

/**
 * 鑾峰彇 AI 鎵规敼缁撴灉
 * @param input - 缁冧範 ID
 * @returns ActionResult<WritingResult>
 */
export async function getWritingResultAction(
  input: GetWritingExerciseInput,
): Promise<ActionResult<WritingResult>> {
  try {
    // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please login first" };
    }

    // 2. zod 鏍￠獙
    const parsed = getWritingExerciseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: getFirstError(parsed.error) };
    }

    // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
    const result = await writingService.getWritingResult(
      user.userId,
      parsed.data,
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get writing result",
    };
  }
}

// ==================== 鑾峰彇鏀硅繘寤鸿 ====================

/**
 * 鑾峰彇鎵规敼鐢熸垚鐨勬敼杩涘缓璁笌鍙傝€冭寖鏂?
 * @param input - 缁冧範 ID
 * @returns ActionResult<WritingSuggestions>
 */
/* export async function getWritingSuggestionsAction(
    input: GetWritingExerciseInput
): Promise<
    ActionResult<Awaited<ReturnType<typeof writingService.getWritingSuggestions>>>
> {
    try {
        // 1. 閴存潈锛氳幏鍙栧綋鍓嶇櫥褰曠敤鎴?
        const user = await getCurrentUser();
        
        if (!user) {
            return { success: false, error: "Unauthorized: Please login first" };
        }

        // 2. zod 鏍￠獙
        const parsed = getWritingExerciseSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }

        // 3. 浣跨敤浠?Session 涓幏鍙栫殑鐪熷疄 userId
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
