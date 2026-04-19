"use server";

import { signToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import * as authService from "@/server/services/auth.service";
import {
    signUpSchema,
    signInSchema,
    type SignUpInput,
    type SignInInput,
} from "@/schema";
import type { ActionResult } from "@/schema";
import type { EnglishLevel, MembershipTier } from "@/schema";
import { getFirstError } from "@/lib/error";

// ==================== 注册 ====================

export async function signUp(
    input: SignUpInput,
): Promise<ActionResult<{ redirect: string }>> {
    const parsed = signUpSchema.safeParse(input);

    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const user = await authService.registerUser(parsed.data);

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            englishLevel: user.englishLevel as EnglishLevel | null,
            membershipTier: user.membershipTier as MembershipTier,
        });

        await setAuthCookie(token);

        return { success: true, data: { redirect: "/onboarding" } };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to register, please try again later",
        };
    }
}

// ==================== 登录 ====================

export async function signIn(
    input: SignInInput,
): Promise<ActionResult<{ redirect: string }>> {
    const parsed = signInSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const user = await authService.loginUser(parsed.data);

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            englishLevel: user.englishLevel as EnglishLevel | null,
            membershipTier: user.membershipTier as MembershipTier,
        });

        await setAuthCookie(token);

        const redirect = user.englishLevel ? "/coach" : "/onboarding";

        return { success: true, data: { redirect } };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to login, please try again later",
        };
    }
}

// ==================== 退出 ====================

export async function signOut(): Promise<void> {
    await clearAuthCookie();
}
