import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

const profileUserSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    englishLevel: true,
    learningGoal: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

const reviewedWritingSelect = {
    grammarScore: true,
    vocabularyScore: true,
    coherenceScore: true,
    taskScore: true,
    overallScore: true,
} satisfies Prisma.WritingExerciseSelect;

const reviewedSpeakingSelect = {
    fluencyScore: true,
    accuracyScore: true,
} satisfies Prisma.SpeakingExerciseSelect;

export async function getProfileSourceData(userId: string) {
    const [
        user,
        writingAggregate,
        reviewedWritingCount,
        speakingCount,
        speakingPerformanceAggregate,
        coachConversationCount,
        reviewedWritingExercises,
        reviewedSpeakingExercises,
        writingActivityDates,
        speakingActivityDates,
        coachActivityDates,
    ] = await Promise.all([
        prisma.user.findFirst({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: profileUserSelect,
        }),
        prisma.writingExercise.aggregate({
            where: {
                userId,
                isDeleted: false,
            },
            _count: {
                _all: true,
            },
            _sum: {
                wordCount: true,
            },
        }),
        prisma.writingExercise.count({
            where: {
                userId,
                isDeleted: false,
                status: "reviewed",
            },
        }),
        prisma.speakingExercise.count({
            where: {
                userId,
                isDeleted: false,
            },
        }),
        prisma.speakingExercise.aggregate({
            where: {
                userId,
                isDeleted: false,
                status: {
                    in: ["completed", "reviewed"],
                },
            },
            _count: {
                _all: true,
            },
            _sum: {
                durationSeconds: true,
            },
            _avg: {
                fluencyScore: true,
                accuracyScore: true,
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
                status: "reviewed",
                overallScore: {
                    not: null,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            select: reviewedWritingSelect,
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
            select: reviewedSpeakingSelect,
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
        writingCount: writingAggregate._count._all,
        totalWords: writingAggregate._sum.wordCount ?? 0,
        reviewedWritingCount,
        speakingCount,
        completedSpeakingCount: speakingPerformanceAggregate._count._all,
        speakingDurationSeconds:
            speakingPerformanceAggregate._sum.durationSeconds ?? 0,
        avgFluency: speakingPerformanceAggregate._avg.fluencyScore ?? null,
        avgAccuracy: speakingPerformanceAggregate._avg.accuracyScore ?? null,
        coachConversationCount,
        reviewedWritingExercises,
        reviewedSpeakingExercises,
        writingActivityDates,
        speakingActivityDates,
        coachActivityDates,
    };
}

export async function getCurrentUserDisplaySourceData(userId: string) {
    const [user, writingActivityDates, speakingActivityDates, coachActivityDates] =
        await Promise.all([
            prisma.user.findFirst({
                where: {
                    id: userId,
                    isDeleted: false,
                },
                select: {
                    email: true,
                    name: true,
                    avatar: true,
                    membershipTier: true,
                },
            }),
            prisma.writingExercise.findMany({
                where: {
                    userId,
                    isDeleted: false,
                },
                select: {
                    createdAt: true,
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
            }),
        ]);

    return {
        user,
        writingActivityDates,
        speakingActivityDates,
        coachActivityDates,
    };
}
