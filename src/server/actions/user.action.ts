"use server";

import * as userService from "@/server/services/user.service";
import {
    updateProfileSchema,
    type UpdateProfileInput,
    changePasswordSchema,
    type UpdatePasswordInput,
} from "@/schema";
import type { ActionResult } from "@/schema";
import { getFirstError } from "@/lib/error";

type UserProfile = {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    englishLevel: string | null;
    membershipTier: string;
    membershipExpiry: string | null;
    learningGoal: string | null;
    createdAt: string;
    updatedAt: string;
};

// ==================== 获取用户信息 ====================

export async function getUserProfile(
    userId: string,
): Promise<ActionResult<{ user: UserProfile }>> {
    try {
        const user = await userService.getUserProfile(userId);
        return { success: true, data: { user } };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get user profile",
        };
    }
}

// ==================== 修改密码 ====================

export async function updatePassword(
    userId: string,
    input: UpdatePasswordInput,
): Promise<ActionResult<{ success: boolean }>> {
    const parsed = changePasswordSchema.safeParse(input);

    if (!parsed.success) {
        return {
            success: false,
            error: getFirstError(parsed.error),
        };
    }

    try {
        await userService.updatePassword(userId, {
            currentPassword: parsed.data.currentPassword,
            newPassword: parsed.data.newPassword,
        });
        return { success: true, data: { success: true } };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update password",
        };
    }
}

// ==================== 更新用户信息 ====================

export async function updateUserProfile(
    userId: string,
    input: UpdateProfileInput,
): Promise<ActionResult<{ user: UserProfile }>> {
    const parsed = updateProfileSchema.safeParse(input);

    if (!parsed.success) {
        return {
            success: false,
            error: getFirstError(parsed.error),
        };
    }

    try {
        const user = await userService.updateUserProfile(userId, parsed.data);
        return { success: true, data: { user } };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update user profile",
        };
    }
}
