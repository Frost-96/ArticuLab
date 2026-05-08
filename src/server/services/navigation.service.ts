import { getCoachConversationSummaries } from "@/server/services/coach.service";
import { getSpeakingHistory } from "@/server/services/speaking.service";
import { getWritingHistory } from "@/server/services/writing.service";
import type { SidebarHistoryItem } from "@/types/navigation/sidebarTypes";

function truncate(value: string, maxLength: number) {
    const trimmed = value.trim();

    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    return `${trimmed.slice(0, maxLength - 1)}...`;
}

export async function getWritingSidebarItems(
    userId: string,
): Promise<SidebarHistoryItem[]> {
    const history = await getWritingHistory(userId, {
        page: 1,
        pageSize: 20,
    });

    return history.exercises.map((exercise) => ({
        id: exercise.id,
        title: truncate(exercise.prompt, 48),
        href: `/writing/${exercise.id}`,
        date: exercise.createdAt,
        badge:
            exercise.overallScore === null
                ? undefined
                : exercise.overallScore.toFixed(1),
    }));
}

export async function getSpeakingSidebarItems(
    userId: string,
): Promise<SidebarHistoryItem[]> {
    const history = await getSpeakingHistory(userId, {
        page: 1,
        pageSize: 20,
    });

    return history.exercises.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        href: `/speaking/${exercise.id}`,
        date: exercise.createdAt,
        badge:
            exercise.fluencyScore === null
                ? undefined
                : exercise.fluencyScore.toFixed(1),
    }));
}

export async function getCoachSidebarItems(
    userId: string,
): Promise<SidebarHistoryItem[]> {
    const conversations = await getCoachConversationSummaries(userId);

    return conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        href: `/coach?id=${conversation.id}`,
        date: conversation.updatedAt,
    }));
}
