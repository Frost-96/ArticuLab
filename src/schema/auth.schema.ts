import { z } from "zod";
import { englishLevelEnum, learningGoalEnum } from "./enums";

// ==================== 认证相关 ====================

// F-002: 邮箱密码注册
export const signUpSchema = z
    .object({
        email: z.email().min(1, "Please enter your email"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-zA-Z]/, "Password must contain letters")
            .regex(/[0-9]/, "Password must contain numbers"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
        name: z
            .string()
            .min(1, "Please enter your nickname")
            .max(50, "Nickname must not exceed 50 characters")
            .optional(),
        redirectTo: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "The passwords you entered do not match",
        path: ["confirmPassword"],
    });

// F-002: 邮箱密码登录
export const signInSchema = z.object({
    email: z.email().min(1, "Please enter your email"),
    password: z.string().min(1, "Please enter your password"),
    redirectTo: z.string().optional(),
});

// F-003: 新用户引导 — 选择水平和目标
export const onboardingSchema = z.object({
    englishLevel: englishLevelEnum,
    learningGoal: learningGoalEnum,
});

// F-003: 个人资料编辑
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(1, "Please enter your nickname")
        .max(50, "Nickname must not exceed 50 characters")
        .optional(),
    avatar: z.url("Avatar link format is incorrect").optional(),
    englishLevel: englishLevelEnum.optional(),
    learningGoal: learningGoalEnum.optional(),
});

// ==================== 类型导出 ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
