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
import { getCurrentUser } from "@/lib/auth";

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

export async function getUserProfile(): Promise<ActionResult<{ userProfile: UserProfile }>> {
    // 1. 鉴权：获取当前登录用户
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    try {
        const userProfile = await userService.getUserProfile(user.userId);
        return { success: true, data: { userProfile } };
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
    input: UpdatePasswordInput,
): Promise<ActionResult<{ success: boolean }>> {
// 1. 鉴权：获取当前登录用户
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: getFirstError(parsed.error),
        };
    }

    try {
        await userService.updatePassword(user.userId, parsed.data);
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
): Promise<ActionResult<{ userProfile: UserProfile }>> {
// 1. 鉴权：获取当前登录用户
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: getFirstError(parsed.error),
        };
    }

    try {
        const userProfile = await userService.updateUserProfile(user.userId, parsed.data);
        return { success: true, data: { userProfile } };
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
