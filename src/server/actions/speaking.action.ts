"use server";

import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import {
    endSpeakingSchema,
    deleteSpeakingExerciseSchema,
    getSpeakingExerciseSchema,
    getSpeakingHistorySchema,
    speakingChatSchema,
    startSpeakingSchema,
    updateSpeakingExerciseSchema,
    type DeleteSpeakingExerciseInput,
    type EndSpeakingInput,
    type GetSpeakingExerciseInput,
    type GetSpeakingHistoryInput,
    type SpeakingChatInput,
    type StartSpeakingInput,
    type UpdateSpeakingExerciseInput,
} from "@/schema";
import type { ActionResult } from "@/schema/shared.schema";
import * as speakingService from "@/server/services/speaking.service";
import type {
    SaveSpeakingMessageResult,
    SpeakingExerciseDetail,
    SpeakingHistoryResult,
    StartSpeakingResult,
} from "@/types/speaking/speakingTypes";

export async function getSpeakingHistoryAction(
    input: GetSpeakingHistoryInput,
): Promise<ActionResult<SpeakingHistoryResult>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = getSpeakingHistorySchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.getSpeakingHistory(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get speaking history",
        };
    }
}

export async function startSpeakingAction(
    input: StartSpeakingInput,
): Promise<ActionResult<StartSpeakingResult>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = startSpeakingSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.startSpeakingExercise(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to start speaking practice",
        };
    }
}

export async function getSpeakingExerciseAction(
    input: GetSpeakingExerciseInput,
): Promise<ActionResult<{ exercise: SpeakingExerciseDetail }>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = getSpeakingExerciseSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.getSpeakingExercise(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get speaking exercise",
        };
    }
}

export async function sendSpeakingMessageAction(
    input: SpeakingChatInput,
): Promise<ActionResult<SaveSpeakingMessageResult>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = speakingChatSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.sendSpeakingMessage(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to send speaking message",
        };
    }
}

export async function endSpeakingAction(
    input: EndSpeakingInput,
): Promise<ActionResult<{ exercise: SpeakingExerciseDetail }>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = endSpeakingSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.endSpeakingExercise(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to end speaking exercise",
        };
    }
}

export async function updateSpeakingExerciseAction(
    input: UpdateSpeakingExerciseInput,
): Promise<ActionResult<{ exercise: SpeakingExerciseDetail }>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = updateSpeakingExerciseSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.updateSpeakingExercise(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update speaking exercise",
        };
    }
}

export async function deleteSpeakingExerciseAction(
    input: DeleteSpeakingExerciseInput,
): Promise<ActionResult<{ id: string }>> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = deleteSpeakingExerciseSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await speakingService.deleteSpeakingExercise(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete speaking exercise",
        };
    }
}
