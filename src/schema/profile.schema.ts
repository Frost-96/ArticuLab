import { z } from "zod";
import {
    englishLevelEnum,
    learningGoalEnum,
    membershipTierEnum,
} from "./enums";

export const currentUserDisplaySummarySchema = z.object({
    displayName: z.string().min(1),
    email: z.email(),
    avatar: z.string().nullable(),
    membershipTier: membershipTierEnum,
    streak: z.number().int().min(0),
});

export const profileHeaderSchema = z.object({
    displayName: z.string().min(1),
    email: z.email(),
    avatar: z.string().nullable(),
    membershipTier: membershipTierEnum,
    englishLevel: englishLevelEnum.nullable(),
    englishLevelLabel: z.string().min(1).nullable(),
    learningGoal: learningGoalEnum.nullable(),
    learningGoalLabel: z.string().min(1).nullable(),
});

export const profileStatsSchema = z.object({
    streak: z.number().int().min(0),
    totalSessions: z.number().int().min(0),
    studyMinutes: z.number().int().min(0),
    totalWords: z.number().int().min(0),
    reviewedWritingCount: z.number().int().min(0),
    completedSpeakingCount: z.number().int().min(0),
    avgFluency: z.number().min(0).max(10).nullable(),
    avgAccuracy: z.number().min(0).max(10).nullable(),
});

export const profileSkillSchema = z.object({
    skill: z.enum([
        "Grammar",
        "Vocabulary",
        "Coherence",
        "Task",
        "Fluency",
        "Accuracy",
    ]),
    score: z.number().min(0).max(10).nullable(),
    scoreLabel: z.string().nullable(),
    progress: z.number().min(0).max(100).nullable(),
});

export const profileAchievementSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    earned: z.boolean(),
});

export const profileEmptyStatesSchema = z.object({
    hasAnyActivity: z.boolean(),
    hasWritingData: z.boolean(),
    hasSpeakingData: z.boolean(),
    hasSkillData: z.boolean(),
});

export const profileDataSchema = z.object({
    header: profileHeaderSchema,
    stats: profileStatsSchema,
    skills: z.array(profileSkillSchema),
    achievements: z.array(profileAchievementSchema),
    emptyStates: profileEmptyStatesSchema,
});

export type CurrentUserDisplaySummary = z.infer<
    typeof currentUserDisplaySummarySchema
>;
export type ProfileHeader = z.infer<typeof profileHeaderSchema>;
export type ProfileStats = z.infer<typeof profileStatsSchema>;
export type ProfileSkill = z.infer<typeof profileSkillSchema>;
export type ProfileAchievement = z.infer<typeof profileAchievementSchema>;
export type ProfileEmptyStates = z.infer<typeof profileEmptyStatesSchema>;
export type ProfileData = z.infer<typeof profileDataSchema>;
