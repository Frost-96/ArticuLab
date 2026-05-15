import { cache } from "react";
import { getFirstError } from "@/lib/error";
import { idSchema } from "@/schema";
import * as coachRepo from "@/server/repositories/coach.repository";
import type {
    CoachConversationDetail,
    CoachConversationSummary,
    CoachPageData,
} from "@/types/coach/coachTypes";

function mapConversationSummary(
    record: Awaited<ReturnType<typeof coachRepo.findCoachConversations>>[number],
): CoachConversationSummary {
    return {
        id: record.id,
        title: record.title?.trim() || "AI Coach Session",
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        messageCount: record._count.messages,
        preview: record.messages[0]?.content ?? null,
    };
}

function mapConversationDetail(
    record: Awaited<ReturnType<typeof coachRepo.findCoachConversationById>>,
): CoachConversationDetail | null {
    if (!record) {
        return null;
    }

    return {
        id: record.id,
        title: record.title?.trim() || "AI Coach Session",
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        messages: record.messages.map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
            audioUrl: message.audioUrl,
            createdAt: message.createdAt.toISOString(),
        })),
    };
}

const loadCoachConversations = cache(async (userId: string) => {
    return coachRepo.findCoachConversations(userId);
});

export async function getCoachPageData(
    userId: string,
    activeConversationId?: string | null,
): Promise<CoachPageData> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const conversations = await loadCoachConversations(parsedId.data);
    const summaries = conversations.map(mapConversationSummary);
    let activeConversation: Awaited<
        ReturnType<typeof coachRepo.findCoachConversationById>
    > = null;

    if (activeConversationId) {
        const parsedConversationId = idSchema.safeParse(activeConversationId);
        if (parsedConversationId.success) {
            activeConversation = await coachRepo.findCoachConversationById(
                parsedId.data,
                parsedConversationId.data,
            );
        }
    }

    return {
        conversations: summaries,
        activeConversation: mapConversationDetail(activeConversation),
    };
}

export async function getCoachConversationSummaries(
    userId: string,
): Promise<CoachConversationSummary[]> {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    const conversations = await loadCoachConversations(parsedId.data);
    return conversations.map(mapConversationSummary);
}
