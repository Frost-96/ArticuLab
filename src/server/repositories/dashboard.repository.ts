import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

const dashboardUserSelect = {
    id: true,
    email: true,
    name: true,
    englishLevel: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

const writingExerciseSelect = {
    id: true,
    scenarioType: true,
    prompt: true,
    status: true,
    wordCount: true,
    overallScore: true,
    grammarScore: true,
    vocabularyScore: true,
    coherenceScore: true,
    taskScore: true,
    feedback: true,
    createdAt: true,
    scenario: {
        select: {
            title: true,
        },
    },
} satisfies Prisma.WritingExerciseSelect;

const speakingExerciseSelect = {
    id: true,
    scenarioType: true,
    scenarioRole: true,
    status: true,
    totalTurns: true,
    durationSeconds: true,
    fluencyScore: true,
    accuracyScore: true,
    feedback: true,
    createdAt: true,
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

const coachConversationSelect = {
    id: true,
    title: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ConversationSelect;

type DashboardQueryOptions = {
    analysisRecentCount: number;
    recentActivityLimit: number;
    trendStartDate: Date;
};

export async function getDashboardSourceData(
    userId: string,
    options: DashboardQueryOptions,
) {
    const recentTake = Math.max(options.recentActivityLimit, 1);

    const [
        user,
        writingCount,
        speakingAggregate,
        coachConversationCount,
        recentWritingExercises,
        recentSpeakingExercises,
        recentCoachConversations,
        reviewedWritingExercises,
        reviewedSpeakingExercises,
        trendWritingExercises,
        trendSpeakingExercises,
        writingActivityDates,
        speakingActivityDates,
        coachActivityDates,
    ] = await Promise.all([
        prisma.user.findFirst({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: dashboardUserSelect,
        }),
        prisma.writingExercise.count({
            where: {
                userId,
                isDeleted: false,
            },
        }),
        prisma.speakingExercise.aggregate({
            where: {
                userId,
                isDeleted: false,
            },
            _count: {
                _all: true,
            },
            _sum: {
                durationSeconds: true,
            },
        }),
        prisma.conversation.count({
            where: {
                userId,
                type: "coach",
                isDeleted: false,
            },
        }),
        prisma.writingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: recentTake,
            select: writingExerciseSelect,
        }),
        prisma.speakingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: recentTake,
            select: speakingExerciseSelect,
        }),
        prisma.conversation.findMany({
            where: {
                userId,
                type: "coach",
                isDeleted: false,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: recentTake,
            select: coachConversationSelect,
        }),
        prisma.writingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
                status: "reviewed",
                overallScore: {
                    not: null,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: options.analysisRecentCount,
            select: writingExerciseSelect,
        }),
        prisma.speakingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
                status: "reviewed",
                fluencyScore: {
                    not: null,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: options.analysisRecentCount,
            select: speakingExerciseSelect,
        }),
        prisma.writingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
                status: "reviewed",
                overallScore: {
                    not: null,
                },
                createdAt: {
                    gte: options.trendStartDate,
                },
            },
            orderBy: {
                createdAt: "asc",
            },
            select: writingExerciseSelect,
        }),
        prisma.speakingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
                status: "reviewed",
                fluencyScore: {
                    not: null,
                },
                createdAt: {
                    gte: options.trendStartDate,
                },
            },
            orderBy: {
                createdAt: "asc",
            },
            select: speakingExerciseSelect,
        }),
        prisma.writingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        prisma.speakingExercise.findMany({
            where: {
                userId,
                isDeleted: false,
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        prisma.conversation.findMany({
            where: {
                userId,
                type: "coach",
                isDeleted: false,
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);

    return {
        user,
        writingCount,
        speakingCount: speakingAggregate._count._all,
        speakingDurationSeconds: speakingAggregate._sum.durationSeconds ?? 0,
        coachConversationCount,
        recentWritingExercises,
        recentSpeakingExercises,
        recentCoachConversations,
        reviewedWritingExercises,
        reviewedSpeakingExercises,
        trendWritingExercises,
        trendSpeakingExercises,
        writingActivityDates,
        speakingActivityDates,
        coachActivityDates,
    };
}
