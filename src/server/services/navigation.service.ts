import { getCoachConversationSummaries } from "@/server/services/coach.service";
import { getSpeakingHistory } from "@/server/services/speaking.service";
import { getWritingHistory } from "@/server/services/writing.service";
import type { SpeakingHistoryItem } from "@/types/speaking/speakingTypes";
import type { SidebarHistoryItem } from "@/types/navigation/sidebarTypes";
import type { WritingExerciseSummary } from "@/types/writing/writingTypes";

function truncate(value: string, maxLength: number) {
    const trimmed = value.trim();

    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    return `${trimmed.slice(0, maxLength - 1)}...`;
}

const writingScenarioTypeLabelMap = {
    daily: "Daily",
    ielts_task1: "IELTS Task 1",
    ielts_task2: "IELTS Task 2",
    toefl: "TOEFL",
    cet4: "CET-4",
    cet6: "CET-6",
} as const;

const speakingScenarioTypeLabelMap = {
    daily: "Daily",
    interview: "Interview",
    travel: "Travel",
    business: "Business",
    free: "Free Talk",
} as const;

function formatStatus(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function getWritingMeta(exercise: WritingExerciseSummary) {
    return [
        writingScenarioTypeLabelMap[exercise.scenarioType],
        `${exercise.wordCount} words`,
        formatStatus(exercise.status),
    ];
}

function getSpeakingMeta(exercise: SpeakingHistoryItem) {
    return [
        speakingScenarioTypeLabelMap[exercise.scenarioType],
        `${exercise.totalTurns} turns`,
        formatDuration(exercise.durationSeconds),
        exercise.fluencyScore === null
            ? "Awaiting review"
            : exercise.accuracyScore === null
              ? `${exercise.fluencyScore.toFixed(1)} fluency`
              : `${exercise.fluencyScore.toFixed(1)} / ${exercise.accuracyScore.toFixed(1)}`,
    ];
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
        meta: getWritingMeta(exercise),
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
        conversationId: exercise.conversationId,
        title: exercise.title,
        href: `/speaking/${exercise.id}`,
        date: exercise.createdAt,
        badge:
            exercise.fluencyScore === null
                ? undefined
                : exercise.fluencyScore.toFixed(1),
        meta: getSpeakingMeta(exercise),
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
