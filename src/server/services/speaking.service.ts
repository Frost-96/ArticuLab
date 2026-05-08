import { cache } from "react";
import { getFirstError } from "@/lib/error";
import {
    endSpeakingSchema,
    deleteSpeakingExerciseSchema,
    getSpeakingExerciseSchema,
    getSpeakingHistorySchema,
    speakingChatSchema,
    speakingReviewResultSchema,
    startSpeakingSchema,
    updateSpeakingExerciseSchema,
    type DeleteSpeakingExerciseInput,
    type EndSpeakingInput,
    type GetSpeakingExerciseInput,
    type GetSpeakingHistoryInput,
    type SpeakingExerciseStatus,
    type SpeakingChatInput,
    type StartSpeakingInput,
    type SpeakingReviewResult,
    type SpeakingScenarioType,
    type UpdateSpeakingExerciseInput,
    idSchema,
} from "@/schema";
import { prisma } from "@/lib/prisma";
import * as speakingRepo from "@/server/repositories/speaking.repository";
import { Prisma } from "../../../generated/prisma/client";
import type {
    SaveSpeakingMessageResult,
    SpeakingExerciseDetail,
    SpeakingHistoryItem,
    SpeakingHistoryResult,
    StartSpeakingResult,
} from "@/types/speaking/speakingTypes";

function parseSpeakingFeedback(raw: unknown): SpeakingReviewResult | null {
    const parsed = speakingReviewResultSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
}

function mapSpeakingDetail(
    record: Awaited<ReturnType<typeof speakingRepo.findSpeakingExerciseById>>,
): SpeakingExerciseDetail {
    if (!record) {
        throw new Error("Speaking exercise not found");
    }

    return {
        id: record.id,
        conversationId: record.conversationId,
        scenarioId: record.scenarioId,
        title:
            record.conversation.title?.trim() ||
            record.scenario?.title ||
            record.scenarioRole,
        prompt: record.scenario?.prompt ?? "",
        description: record.scenario?.description ?? "",
        aiRole: record.scenario?.aiRole?.trim() || record.scenarioRole,
        scenarioType: record.scenarioType as SpeakingScenarioType,
        status: record.status as SpeakingExerciseStatus,
        totalTurns: record.totalTurns ?? record.conversation.messages.length,
        durationSeconds: record.durationSeconds ?? 0,
        fluencyScore: record.fluencyScore,
        accuracyScore: record.accuracyScore,
        feedback: parseSpeakingFeedback(record.feedback),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        messages: record.conversation.messages.map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
            audioUrl: message.audioUrl,
            createdAt: message.createdAt.toISOString(),
        })),
    };
}

function mapSpeakingHistoryItem(
    record: Awaited<ReturnType<typeof speakingRepo.findSpeakingExercises>>["rows"][number],
): SpeakingHistoryItem {
    return {
        id: record.id,
        title:
            record.conversation?.title?.trim() ||
            record.scenario?.title ||
            record.scenarioRole,
        scenarioType: record.scenarioType as SpeakingScenarioType,
        scenarioRole: record.scenarioRole,
        status: record.status as SpeakingExerciseStatus,
        totalTurns: record.totalTurns ?? 0,
        durationSeconds: record.durationSeconds ?? 0,
        fluencyScore: record.fluencyScore,
        accuracyScore: record.accuracyScore,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

const loadSpeakingHistory = cache(
    async (
        userId: string,
        scenarioType: SpeakingScenarioType | undefined,
        page: number,
        pageSize: number,
    ): Promise<SpeakingHistoryResult> => {
        const skip = (page - 1) * pageSize;
        const { rows, total } = await speakingRepo.findSpeakingExercises({
            userId,
            scenarioType,
            skip,
            take: pageSize,
        });

        return {
            exercises: rows.map(mapSpeakingHistoryItem),
            pagination: {
                page,
                limit: pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
        };
    },
);

export async function getSpeakingHistory(
    userId: string,
    params: GetSpeakingHistoryInput,
): Promise<SpeakingHistoryResult> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedParams = getSpeakingHistorySchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { page, pageSize, scenarioType } = parsedParams.data;
    return loadSpeakingHistory(parsedId.data, scenarioType, page, pageSize);
}

export async function startSpeakingExercise(
    userId: string,
    input: StartSpeakingInput,
): Promise<StartSpeakingResult> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = startSpeakingSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const scenario = await prisma.scenario.findFirst({
        where: {
            id: parsedInput.data.scenarioId,
            type: "speaking",
            isDeleted: false,
        },
        select: {
            id: true,
            title: true,
            description: true,
            prompt: true,
            aiRole: true,
            category: true,
        },
    });

    if (!scenario) {
        throw new Error("Speaking scenario not found");
    }

    const exercise = await speakingRepo.createSpeakingExercise({
        userId: parsedId.data,
        scenarioId: scenario.id,
        scenarioType: scenario.category as SpeakingScenarioType,
        scenarioRole: scenario.aiRole?.trim() || scenario.title,
        conversationTitle: scenario.title,
    });

    return {
        exercise: mapSpeakingDetail(exercise),
    };
}

export async function getSpeakingExercise(
    userId: string,
    input: GetSpeakingExerciseInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = getSpeakingExerciseSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const exercise = await speakingRepo.findSpeakingExerciseById(
        parsedInput.data.id,
        parsedId.data,
    );

    return {
        exercise: mapSpeakingDetail(exercise),
    };
}

export async function sendSpeakingMessage(
    userId: string,
    input: SpeakingChatInput,
): Promise<SaveSpeakingMessageResult> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = speakingChatSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const exercise = await speakingRepo.findSpeakingExerciseById(
        parsedInput.data.exerciseId,
        parsedId.data,
    );

    if (!exercise) {
        throw new Error("Speaking exercise not found");
    }

    if (exercise.conversationId !== parsedInput.data.conversationId) {
        throw new Error("Conversation does not match the exercise");
    }

    const { message, totalTurns } = await speakingRepo.saveSpeakingMessage({
        exerciseId: exercise.id,
        conversationId: exercise.conversationId,
        role: "user",
        content: parsedInput.data.message.trim(),
    });

    return {
        message: {
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
            audioUrl: message.audioUrl,
            createdAt: message.createdAt.toISOString(),
        },
        totalTurns,
    };
}

export async function endSpeakingExercise(
    userId: string,
    input: EndSpeakingInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = endSpeakingSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const exercise = await speakingRepo.findSpeakingExerciseById(
        parsedInput.data.exerciseId,
        parsedId.data,
    );

    if (!exercise) {
        throw new Error("Speaking exercise not found");
    }

    const totalTurns = exercise.conversation.messages.length;
    const durationSeconds = Math.max(
        0,
        Math.floor((Date.now() - exercise.createdAt.getTime()) / 1000),
    );

    const updated = await speakingRepo.completeSpeakingExercise({
        exerciseId: exercise.id,
        status: exercise.feedback ? "reviewed" : "completed",
        totalTurns,
        durationSeconds,
    });

    return {
        exercise: mapSpeakingDetail(updated),
    };
}

export async function updateSpeakingExercise(
    userId: string,
    input: UpdateSpeakingExerciseInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = updateSpeakingExerciseSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const exercise = await speakingRepo.findSpeakingExerciseById(
        parsedInput.data.id,
        parsedId.data,
    );
    if (!exercise) {
        throw new Error("Speaking exercise not found");
    }

    const updateData: Pick<
        Prisma.SpeakingExerciseUncheckedUpdateInput,
        | "status"
        | "totalTurns"
        | "durationSeconds"
        | "fluencyScore"
        | "accuracyScore"
        | "feedback"
    > = {};

    if (parsedInput.data.status !== undefined) {
        updateData.status = parsedInput.data.status;
    }
    if (parsedInput.data.totalTurns !== undefined) {
        updateData.totalTurns = parsedInput.data.totalTurns;
    }
    if (parsedInput.data.durationSeconds !== undefined) {
        updateData.durationSeconds = parsedInput.data.durationSeconds;
    }
    if (parsedInput.data.fluencyScore !== undefined) {
        updateData.fluencyScore = parsedInput.data.fluencyScore;
    }
    if (parsedInput.data.accuracyScore !== undefined) {
        updateData.accuracyScore = parsedInput.data.accuracyScore;
    }
    if (parsedInput.data.feedback !== undefined) {
        if (parsedInput.data.feedback === null) {
            updateData.feedback = Prisma.JsonNull;
        } else {
            const parsedFeedback = speakingReviewResultSchema.safeParse(
                parsedInput.data.feedback,
            );
            if (!parsedFeedback.success) {
                throw new Error(getFirstError(parsedFeedback.error));
            }
            updateData.feedback = parsedFeedback.data;
            updateData.fluencyScore =
                parsedInput.data.fluencyScore ?? parsedFeedback.data.fluencyScore;
            updateData.accuracyScore =
                parsedInput.data.accuracyScore ??
                parsedFeedback.data.accuracyScore;
            updateData.status = parsedInput.data.status ?? "reviewed";
        }
    }

    const updated = await speakingRepo.updateSpeakingExercise(
        exercise.id,
        updateData,
    );

    return {
        exercise: mapSpeakingDetail(updated),
    };
}

export async function deleteSpeakingExercise(
    userId: string,
    input: DeleteSpeakingExerciseInput,
): Promise<{ id: string }> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const parsedInput = deleteSpeakingExerciseSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const exercise = await speakingRepo.findSpeakingExerciseById(
        parsedInput.data.id,
        parsedId.data,
    );
    if (!exercise) {
        throw new Error("Speaking exercise not found");
    }

    return speakingRepo.deleteSpeakingExercise({
        exerciseId: exercise.id,
        conversationId: exercise.conversationId,
    });
}
