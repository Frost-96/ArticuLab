import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { SpeakingExerciseStatus, SpeakingScenarioType } from "@/schema";

const speakingMessageSelect = {
    id: true,
    role: true,
    content: true,
    audioUrl: true,
    createdAt: true,
} satisfies Prisma.MessageSelect;

const speakingExerciseListSelect = {
    id: true,
    scenarioType: true,
    scenarioRole: true,
    status: true,
    totalTurns: true,
    durationSeconds: true,
    fluencyScore: true,
    accuracyScore: true,
    createdAt: true,
    updatedAt: true,
    scenario: {
        select: {
            title: true,
        },
    },
    conversation: {
        select: {
            title: true,
        },
    },
} satisfies Prisma.SpeakingExerciseSelect;

const speakingExerciseDetailSelect = {
    id: true,
    scenarioId: true,
    scenarioType: true,
    scenarioRole: true,
    conversationId: true,
    status: true,
    totalTurns: true,
    durationSeconds: true,
    fluencyScore: true,
    accuracyScore: true,
    feedback: true,
    createdAt: true,
    updatedAt: true,
    scenario: {
        select: {
            title: true,
            description: true,
            prompt: true,
            aiRole: true,
        },
    },
    conversation: {
        select: {
            title: true,
            messages: {
                where: {
                    isDeleted: false,
                },
                orderBy: {
                    createdAt: "asc",
                },
                select: speakingMessageSelect,
            },
        },
    },
} satisfies Prisma.SpeakingExerciseSelect;

export async function findSpeakingExercises(params: {
    userId: string;
    scenarioType?: SpeakingScenarioType;
    skip?: number;
    take?: number;
}) {
    const { userId, scenarioType, skip = 0, take = 20 } = params;

    const where: Prisma.SpeakingExerciseWhereInput = {
        userId,
        isDeleted: false,
        ...(scenarioType ? { scenarioType } : {}),
    };

    const [rows, total] = await prisma.$transaction([
        prisma.speakingExercise.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
            select: speakingExerciseListSelect,
        }),
        prisma.speakingExercise.count({ where }),
    ]);

    return { rows, total };
}

export async function findSpeakingExerciseById(id: string, userId: string) {
    return prisma.speakingExercise.findFirst({
        where: {
            id,
            userId,
            isDeleted: false,
            conversation: {
                isDeleted: false,
            },
        },
        select: speakingExerciseDetailSelect,
    });
}

export async function createSpeakingExercise(data: {
    userId: string;
    scenarioId: string;
    scenarioType: SpeakingScenarioType;
    scenarioRole: string;
    conversationTitle: string;
}) {
    return prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.create({
            data: {
                userId: data.userId,
                type: "speaking",
                title: data.conversationTitle,
                scenarioId: data.scenarioId,
            },
            select: {
                id: true,
            },
        });

        const exercise = await tx.speakingExercise.create({
            data: {
                userId: data.userId,
                scenarioId: data.scenarioId,
                scenarioType: data.scenarioType,
                scenarioRole: data.scenarioRole,
                conversationId: conversation.id,
                status: "in_progress",
                totalTurns: 0,
                durationSeconds: 0,
            },
            select: {
                id: true,
            },
        });

        return tx.speakingExercise.findUniqueOrThrow({
            where: {
                id: exercise.id,
            },
            select: speakingExerciseDetailSelect,
        });
    });
}

export async function saveSpeakingMessage(data: {
    exerciseId: string;
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    audioUrl?: string | null;
}) {
    return prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                conversationId: data.conversationId,
                role: data.role,
                content: data.content,
                audioUrl: data.audioUrl ?? null,
            },
            select: speakingMessageSelect,
        });

        const totalTurns = await tx.message.count({
            where: {
                conversationId: data.conversationId,
                isDeleted: false,
            },
        });

        await tx.speakingExercise.update({
            where: {
                id: data.exerciseId,
            },
            data: {
                totalTurns,
            },
        });

        return { message, totalTurns };
    });
}

export async function completeSpeakingExercise(data: {
    exerciseId: string;
    status: SpeakingExerciseStatus;
    totalTurns: number;
    durationSeconds: number;
}) {
    return prisma.speakingExercise.update({
        where: {
            id: data.exerciseId,
        },
        data: {
            status: data.status,
            totalTurns: data.totalTurns,
            durationSeconds: data.durationSeconds,
        },
        select: speakingExerciseDetailSelect,
    });
}

export async function updateSpeakingExercise(
    exerciseId: string,
    data: Pick<
        Prisma.SpeakingExerciseUncheckedUpdateInput,
        | "status"
        | "totalTurns"
        | "durationSeconds"
        | "fluencyScore"
        | "accuracyScore"
        | "feedback"
    >,
) {
    return prisma.speakingExercise.update({
        where: {
            id: exerciseId,
        },
        data,
        select: speakingExerciseDetailSelect,
    });
}

export async function deleteSpeakingExercise(data: {
    exerciseId: string;
    conversationId: string;
}) {
    return prisma.$transaction(async (tx) => {
        await tx.message.updateMany({
            where: {
                conversationId: data.conversationId,
                isDeleted: false,
            },
            data: {
                isDeleted: true,
            },
        });

        await tx.conversation.update({
            where: {
                id: data.conversationId,
            },
            data: {
                isDeleted: true,
            },
            select: {
                id: true,
            },
        });

        return tx.speakingExercise.update({
            where: {
                id: data.exerciseId,
            },
            data: {
                isDeleted: true,
            },
            select: {
                id: true,
            },
        });
    });
}
