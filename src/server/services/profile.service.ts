import {
    currentUserDisplaySummarySchema,
    englishLevelEnum,
    learningGoalEnum,
    membershipTierEnum,
    profileDataSchema,
    type CurrentUserDisplaySummary,
    type ProfileData,
} from "@/schema";
import {
    formatEnglishLevel,
    formatLearningGoal,
    getDisplayName,
} from "@/lib/user-display";
import {
    getCurrentUserDisplaySourceData,
    getProfileSourceData,
} from "@/server/repositories/profile.repository";
import {
    buildSkillScores,
    calculateConsecutiveDays,
} from "@/server/services/learning-metrics";

export async function getProfileData(userId: string): Promise<ProfileData> {
    const source = await getProfileSourceData(userId);

    if (!source.user) {
        throw new Error("Profile user not found");
    }

    const displayName = getDisplayName(source.user.name, source.user.email);
    const parsedEnglishLevel = englishLevelEnum.safeParse(source.user.englishLevel);
    const englishLevel = parsedEnglishLevel.success
        ? parsedEnglishLevel.data
        : null;
    const parsedLearningGoal = learningGoalEnum.safeParse(source.user.learningGoal);
    const learningGoal = parsedLearningGoal.success
        ? parsedLearningGoal.data
        : null;
    const parsedMembershipTier = membershipTierEnum.safeParse(
        source.user.membershipTier,
    );
    const membershipTier = parsedMembershipTier.success
        ? parsedMembershipTier.data
        : "free";

    const streak = calculateConsecutiveDays([
        ...source.writingActivityDates.map((item) => item.createdAt),
        ...source.speakingActivityDates.map((item) => item.createdAt),
        ...source.coachActivityDates.map((item) => item.createdAt),
    ]);

    const skills = buildSkillScores(
        source.reviewedWritingExercises,
        source.reviewedSpeakingExercises,
    ).map((item) => ({
        skill: item.skill,
        score: item.score,
        scoreLabel: item.score === null ? null : `${item.score.toFixed(1)}/10`,
        progress: item.score === null ? null : Math.round(item.score * 10),
    }));

    const totalSessions =
        source.writingCount + source.speakingCount + source.coachConversationCount;
    const studyMinutes = Math.floor(source.speakingDurationSeconds / 60);

    return profileDataSchema.parse({
        header: {
            displayName,
            email: source.user.email,
            avatar: source.user.avatar ?? null,
            membershipTier,
            englishLevel,
            englishLevelLabel: formatEnglishLevel(englishLevel),
            learningGoal,
            learningGoalLabel: formatLearningGoal(learningGoal),
        },
        stats: {
            streak,
            totalSessions,
            studyMinutes,
            totalWords: source.totalWords,
            reviewedWritingCount: source.reviewedWritingCount,
            completedSpeakingCount: source.completedSpeakingCount,
            avgFluency: source.avgFluency,
            avgAccuracy: source.avgAccuracy,
        },
        skills,
        achievements: [
            {
                id: "first-essay",
                label: "First Essay",
                description: "Complete your first writing session.",
                earned: source.writingCount > 0,
            },
            {
                id: "seven-day-streak",
                label: "7-Day Streak",
                description: "Practice for seven days in a row.",
                earned: streak >= 7,
            },
            {
                id: "pro-member",
                label: "Pro Member",
                description: "Unlock the full ArticuLab experience.",
                earned: membershipTier === "pro",
            },
            {
                id: "speaking-star",
                label: "Speaking Star",
                description: "Finish at least three speaking sessions.",
                earned: source.completedSpeakingCount >= 3,
            },
        ],
        emptyStates: {
            hasAnyActivity: totalSessions > 0,
            hasWritingData: source.reviewedWritingCount > 0,
            hasSpeakingData: source.reviewedSpeakingExercises.length > 0,
            hasSkillData: skills.some((item) => item.score !== null),
        },
    });
}

export async function getCurrentUserDisplaySummary(
    userId: string,
): Promise<CurrentUserDisplaySummary | null> {
    const source = await getCurrentUserDisplaySourceData(userId);

    if (!source.user) {
        return null;
    }

    const parsedMembershipTier = membershipTierEnum.safeParse(
        source.user.membershipTier,
    );
    const membershipTier = parsedMembershipTier.success
        ? parsedMembershipTier.data
        : "free";

    const streak = calculateConsecutiveDays([
        ...source.writingActivityDates.map((item) => item.createdAt),
        ...source.speakingActivityDates.map((item) => item.createdAt),
        ...source.coachActivityDates.map((item) => item.createdAt),
    ]);

    return currentUserDisplaySummarySchema.parse({
        displayName: getDisplayName(source.user.name, source.user.email),
        email: source.user.email,
        avatar: source.user.avatar ?? null,
        membershipTier,
        streak,
    });
}
