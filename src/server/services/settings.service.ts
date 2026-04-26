import { format } from "date-fns";
import type { UpdateProfileInput } from "@/schema";
import {
    englishLevelEnum,
    learningGoalEnum,
    membershipTierEnum,
    settingsDataSchema,
    subscriptionPlanEnum,
    subscriptionStatusEnum,
    type SettingsData,
} from "@/schema";
import {
    formatEnglishLevel,
    formatLearningGoal,
    getDisplayName,
} from "@/lib/user-display";
import { getSettingsSourceData } from "@/server/repositories/settings.repository";
import * as userRepo from "@/server/repositories/user.repository";

export async function getSettingsData(userId: string): Promise<SettingsData> {
    const source = await getSettingsSourceData(userId);

    if (!source.user) {
        throw new Error("Settings user not found");
    }

    const englishLevel = parseEnglishLevel(source.user.englishLevel);
    const learningGoal = parseLearningGoal(source.user.learningGoal);
    const membershipTier = parseMembershipTier(source.user.membershipTier);
    const subscriptionPlan = parseSubscriptionPlan(source.activeSubscription?.plan);
    const subscriptionStatus = parseSubscriptionStatus(
        source.activeSubscription?.status,
    );
    const subscriptionPeriodLabel = source.activeSubscription
        ? `${format(source.activeSubscription.startDate, "MMM d, yyyy")} - ${format(source.activeSubscription.endDate, "MMM d, yyyy")}`
        : null;

    return settingsDataSchema.parse({
        account: {
            name: source.user.name ?? null,
            displayName: getDisplayName(source.user.name, source.user.email),
            email: source.user.email,
            avatar: source.user.avatar ?? null,
            englishLevel,
            englishLevelLabel: formatEnglishLevel(englishLevel),
            learningGoal,
            learningGoalLabel: formatLearningGoal(learningGoal),
        },
        membership: {
            membershipTier,
            subscriptionPlan,
            subscriptionStatus,
            subscriptionPeriodLabel,
            hasActiveSubscription: Boolean(source.activeSubscription),
        },
        readonlyModules: {
            notifications: {
                title: "Notifications",
                description:
                    "Email reminders and learning alerts are not configurable yet.",
                detail:
                    "Notification preferences will be added once persistent user settings are available.",
                statusLabel: "Coming soon",
            },
            appearance: {
                title: "Appearance",
                description:
                    "Theme preferences are not saved to your account yet.",
                detail:
                    "Dark mode and appearance sync will ship with persistent UI preferences.",
                statusLabel: "Local preference unavailable",
            },
            language: {
                title: "Language & Region",
                description:
                    "Interface language settings are not connected to your profile yet.",
                detail:
                    "English remains the default interface until localization settings are introduced.",
                statusLabel: "Coming soon",
            },
        },
        dangerZone: {
            canLogout: true,
            canDeleteAccount: false,
        },
    });
}

export async function updateSettingsProfile(
    userId: string,
    input: UpdateProfileInput,
) {
    const existingUser = await userRepo.findUserById(userId);

    if (!existingUser) {
        throw new Error("User not found");
    }

    return userRepo.updateUserProfile({
        userId,
        name: input.name ?? null,
        avatar: input.avatar ?? null,
        englishLevel: input.englishLevel ?? null,
        learningGoal: input.learningGoal ?? null,
    });
}

function parseEnglishLevel(value: string | null | undefined) {
    const parsed = englishLevelEnum.safeParse(value);
    return parsed.success ? parsed.data : null;
}

function parseLearningGoal(value: string | null | undefined) {
    const parsed = learningGoalEnum.safeParse(value);
    return parsed.success ? parsed.data : null;
}

function parseMembershipTier(value: string | null | undefined) {
    const parsed = membershipTierEnum.safeParse(value);
    return parsed.success ? parsed.data : "free";
}

function parseSubscriptionPlan(value: string | null | undefined) {
    const parsed = subscriptionPlanEnum.safeParse(value);
    return parsed.success ? parsed.data : null;
}

function parseSubscriptionStatus(value: string | null | undefined) {
    const parsed = subscriptionStatusEnum.safeParse(value);
    return parsed.success ? parsed.data : null;
}
