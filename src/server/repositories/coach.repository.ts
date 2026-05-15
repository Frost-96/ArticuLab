import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

const coachMessageSelect = {
    id: true,
    role: true,
    content: true,
    audioUrl: true,
    createdAt: true,
} satisfies Prisma.MessageSelect;

const coachConversationSummarySelect = {
    id: true,
    title: true,
    createdAt: true,
    updatedAt: true,
    messages: {
        where: {
            isDeleted: false,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 1,
        select: {
            content: true,
        },
    },
    _count: {
        select: {
            messages: true,
        },
    },
} satisfies Prisma.ConversationSelect;

const coachConversationDetailSelect = {
    id: true,
    title: true,
    createdAt: true,
    updatedAt: true,
    messages: {
        where: {
            isDeleted: false,
        },
        orderBy: {
            createdAt: "asc",
        },
        select: coachMessageSelect,
    },
} satisfies Prisma.ConversationSelect;

export async function findCoachConversations(userId: string) {
    return prisma.conversation.findMany({
        where: {
            userId,
            type: "coach",
            isDeleted: false,
        },
        orderBy: {
            updatedAt: "desc",
        },
        select: coachConversationSummarySelect,
    });
}

export async function findCoachConversationById(userId: string, id: string) {
    return prisma.conversation.findFirst({
        where: {
            id,
            userId,
            type: "coach",
            isDeleted: false,
        },
        select: coachConversationDetailSelect,
    });
}

export async function findLatestCoachConversation(userId: string) {
    return prisma.conversation.findFirst({
        where: {
            userId,
            type: "coach",
            isDeleted: false,
        },
        orderBy: {
            updatedAt: "desc",
        },
        select: coachConversationDetailSelect,
    });
}
