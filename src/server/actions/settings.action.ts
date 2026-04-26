"use server";

import {
    getCurrentUser,
    hasCompletedOnboarding,
    setAuthCookie,
    signToken,
} from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import {
    updateProfileSchema,
    type EnglishLevel,
    type MembershipTier,
    type UpdateProfileInput,
} from "@/schema";
import type { ActionResult } from "@/schema/shared.schema";
import { updateSettingsProfile } from "@/server/services/settings.service";

export async function saveSettingsProfile(
    input: UpdateProfileInput,
): Promise<ActionResult<{ message: string }>> {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return {
            success: false,
            error: "Please log in again and retry",
        };
    }

    const parsed = updateProfileSchema.safeParse(input);

    if (!parsed.success) {
        return {
            success: false,
            error: getFirstError(parsed.error),
        };
    }

    try {
        const user = await updateSettingsProfile(currentUser.userId, parsed.data);

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            englishLevel: user.englishLevel as EnglishLevel | null,
            hasCompletedOnboarding: hasCompletedOnboarding({
                englishLevel: user.englishLevel as EnglishLevel | null,
                learningGoal: user.learningGoal,
            }),
            membershipTier: user.membershipTier as MembershipTier,
        });

        await setAuthCookie(token);

        return {
            success: true,
            data: {
                message: "Profile updated successfully",
            },
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update your profile",
        };
    }
}
