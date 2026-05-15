import { prisma } from "@/lib/prisma";
import type { ConversationType, MessageRole } from "@/schema";
import { Prisma } from "../../../generated/prisma/client";

const messageSelect = {
    id: true,
    conversationId: true,
    role: true,
    content: true,
    audioUrl: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.MessageSelect;

const conversationSummarySelect = {
    id: true,
    userId: true,
    type: true,
    title: true,
    scenarioId: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            messages: true,
        },
    },
} satisfies Prisma.ConversationSelect;

const conversationDetailSelect = {
    id: true,
    userId: true,
    type: true,
    title: true,
    scenarioId: true,
    createdAt: true,
    updatedAt: true,
    scenario: {
        select: {
            title: true,
            type: true,
            category: true,
        },
    },
    messages: {
        where: {
            isDeleted: false,
        },
        orderBy: {
            createdAt: "asc",
        },
        select: messageSelect,
    },
} satisfies Prisma.ConversationSelect;

export async function findConversations(params: {
    userId: string;
    type?: ConversationType;
    skip?: number;
    take?: number;
}) {
    const { userId, type, skip = 0, take = 20 } = params;
    const where: Prisma.ConversationWhereInput = {
        userId,
        isDeleted: false,
        ...(type ? { type } : {}),
    };

    const [rows, total] = await prisma.$transaction([
        prisma.conversation.findMany({
            where,
            orderBy: {
                updatedAt: "desc",
            },
            skip,
            take,
            select: conversationSummarySelect,
        }),
        prisma.conversation.count({ where }),
    ]);

    return { rows, total };
}

export async function findConversationById(id: string, userId: string) {
    return prisma.conversation.findFirst({
        where: {
            id,
            userId,
            isDeleted: false,
        },
        select: conversationDetailSelect,
    });
}

export async function createConversation(data: {
    userId: string;
    type: ConversationType;
    title?: string | null;
    scenarioId?: string | null;
}) {
    return prisma.conversation.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title?.trim() || null,
            scenarioId: data.scenarioId ?? null,
        },
        select: conversationDetailSelect,
    });
}

export async function updateConversationTitle(id: string, title: string) {
    return prisma.conversation.update({
        where: {
            id,
        },
        data: {
            title: title.trim(),
        },
        select: conversationDetailSelect,
    });
}

export async function deleteConversation(id: string) {
    return prisma.$transaction(async (tx) => {
        await tx.message.updateMany({
            where: {
                conversationId: id,
                isDeleted: false,
            },
            data: {
                isDeleted: true,
            },
        });

        await tx.speakingExercise.updateMany({
            where: {
                conversationId: id,
                isDeleted: false,
            },
            data: {
                isDeleted: true,
            },
        });

        return tx.conversation.update({
            where: {
                id,
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

export async function findMessages(params: {
    userId: string;
    conversationId: string;
    cursor?: string;
    take?: number;
}) {
    const { userId, conversationId, cursor, take = 50 } = params;

    return prisma.message.findMany({
        where: {
            conversationId,
            isDeleted: false,
            conversation: {
                userId,
                isDeleted: false,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take,
        select: messageSelect,
    });
}

export async function findMessageByIdForUser(id: string, userId: string) {
    return prisma.message.findFirst({
        where: {
            id,
            isDeleted: false,
            conversation: {
                userId,
                isDeleted: false,
            },
        },
        select: {
            ...messageSelect,
            conversation: {
                select: {
                    id: true,
                    userId: true,
                },
            },
        },
    });
}

export async function createMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    audioUrl?: string | null;
}) {
    return prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                conversationId: data.conversationId,
                role: data.role,
                content: data.content.trim(),
                audioUrl: data.audioUrl ?? null,
            },
            select: messageSelect,
        });

        await tx.conversation.update({
            where: {
                id: data.conversationId,
            },
            data: {
                updatedAt: new Date(),
            },
            select: {
                id: true,
            },
        });

        return message;
    });
}

export async function updateMessage(
    id: string,
    data: {
        content?: string;
        audioUrl?: string | null;
    },
) {
    return prisma.message.update({
        where: {
            id,
        },
        data: {
            ...(data.content !== undefined && { content: data.content.trim() }),
            ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
        },
        select: messageSelect,
    });
}

export async function deleteMessage(id: string) {
    return prisma.message.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
        },
        select: {
            id: true,
            conversationId: true,
        },
    });
}
