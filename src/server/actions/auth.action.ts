"use server";

import {
    clearAuthCookie,
    getCurrentUser,
    hasCompletedOnboarding,
    resolveAuthenticatedRedirect,
    setAuthCookie,
    signToken,
} from "@/lib/auth";
import * as authService from "@/server/services/auth.service";
import {
    onboardingSchema,
    signUpSchema,
    signInSchema,
    type OnboardingInput,
    type SignUpInput,
    type SignInInput,
} from "@/schema";
import type { ActionResult } from "@/schema/shared.schema";
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
                redirect: resolveAuthenticatedRedirect(
                    {
                        englishLevel: user.englishLevel as EnglishLevel | null,
                        hasCompletedOnboarding: hasCompletedOnboarding({
                            englishLevel: user.englishLevel as EnglishLevel | null,
                            learningGoal: user.learningGoal,
                        }),
                    },
                    parsed.data.redirectTo,
                ),
            },
        };
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

export async function login(
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
            hasCompletedOnboarding: hasCompletedOnboarding({
                englishLevel: user.englishLevel as EnglishLevel | null,
                learningGoal: user.learningGoal,
            }),
            membershipTier: user.membershipTier as MembershipTier,
        });

        await setAuthCookie(token);

        const redirect = resolveAuthenticatedRedirect(
            {
                englishLevel: user.englishLevel as EnglishLevel | null,
                hasCompletedOnboarding: hasCompletedOnboarding({
                    englishLevel: user.englishLevel as EnglishLevel | null,
                    learningGoal: user.learningGoal,
                }),
            },
            parsed.data.redirectTo,
        );

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

// ==================== Onboarding ====================

export async function completeOnboarding(
    input: OnboardingInput,
): Promise<ActionResult<{ redirect: string }>> {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return {
            success: false,
            error: "Please log in again and retry",
        };
    }

    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const user = await authService.completeOnboarding({
            userId: currentUser.userId,
            englishLevel: parsed.data.englishLevel,
            learningGoal: parsed.data.learningGoal,
        });

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
                redirect: resolveAuthenticatedRedirect({
                    englishLevel: user.englishLevel as EnglishLevel | null,
                    hasCompletedOnboarding: hasCompletedOnboarding({
                        englishLevel: user.englishLevel as EnglishLevel | null,
                        learningGoal: user.learningGoal,
                    }),
                }),
            },
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to save onboarding details",
        };
    }
}

// ==================== 退出 ====================

export async function logOut(): Promise<void> {
    await clearAuthCookie();
}
