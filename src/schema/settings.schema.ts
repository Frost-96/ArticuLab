import { z } from "zod";
import {
    englishLevelEnum,
    learningGoalEnum,
    membershipTierEnum,
    subscriptionPlanEnum,
    subscriptionStatusEnum,
} from "./enums";

export const settingsAccountSchema = z.object({
    name: z.string().nullable(),
    displayName: z.string().min(1),
    email: z.email(),
    avatar: z.string().nullable(),
    englishLevel: englishLevelEnum.nullable(),
    englishLevelLabel: z.string().min(1).nullable(),
    learningGoal: learningGoalEnum.nullable(),
    learningGoalLabel: z.string().min(1).nullable(),
});

export const settingsMembershipSchema = z.object({
    membershipTier: membershipTierEnum,
    subscriptionPlan: subscriptionPlanEnum.nullable(),
    subscriptionStatus: subscriptionStatusEnum.nullable(),
    subscriptionPeriodLabel: z.string().min(1).nullable(),
    hasActiveSubscription: z.boolean(),
});

export const settingsReadonlyModuleSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    detail: z.string().min(1),
    statusLabel: z.string().min(1),
});

export const settingsDangerZoneSchema = z.object({
    canLogout: z.boolean(),
    canDeleteAccount: z.boolean(),
});

export const settingsDataSchema = z.object({
    account: settingsAccountSchema,
    membership: settingsMembershipSchema,
    readonlyModules: z.object({
        notifications: settingsReadonlyModuleSchema,
        appearance: settingsReadonlyModuleSchema,
        language: settingsReadonlyModuleSchema,
    }),
    dangerZone: settingsDangerZoneSchema,
});

export type SettingsAccount = z.infer<typeof settingsAccountSchema>;
export type SettingsMembership = z.infer<typeof settingsMembershipSchema>;
export type SettingsReadonlyModule = z.infer<
    typeof settingsReadonlyModuleSchema
>;
export type SettingsDangerZone = z.infer<typeof settingsDangerZoneSchema>;
export type SettingsData = z.infer<typeof settingsDataSchema>;
