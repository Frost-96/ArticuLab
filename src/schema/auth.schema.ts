import { z } from "zod";
import { englishLevelEnum, learningGoalEnum } from "./enums";

// ==================== 璁よ瘉鐩稿叧 ====================

// F-002: 閭瀵嗙爜娉ㄥ唽
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

// F-002: 閭瀵嗙爜鐧诲綍
export const signInSchema = z.object({
    email: z.email().min(1, "Please enter your email"),
    password: z.string().min(1, "Please enter your password"),
    redirectTo: z.string().optional(),
});

// F-003: 鏂扮敤鎴峰紩�??�??閫夋嫨姘村钩鍜岀洰鏍?
export const onboardingSchema = z.object({
    englishLevel: englishLevelEnum,
    learningGoal: learningGoalEnum,
});

const optionalNullableTrimmedString = (
    schema: z.ZodType<string | null>,
) =>
    z.preprocess((value) => {
        if (typeof value !== "string") {
            return value;
        }

        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    }, schema.optional());

// F-003: 涓汉璧勬枡缂栬�?
export const updateProfileSchema = z.object({
    name: optionalNullableTrimmedString(
        z
            .string()
            .min(1, "Please enter your nickname")
            .max(50, "Nickname must not exceed 50 characters")
            .nullable(),
    ),
    avatar: optionalNullableTrimmedString(
        z.url("Avatar link format is incorrect").nullable(),
    ),
    englishLevel: z.preprocess(
        (value) => (value === "" ? null : value),
        englishLevelEnum.nullable().optional(),
    ),
    learningGoal: z.preprocess(
        (value) => (value === "" ? null : value),
        learningGoalEnum.nullable().optional(),
    ),
});

// 修改密码
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Please enter your current password"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-zA-Z]/, "Password must contain letters")
            .regex(/[0-9]/, "Password must contain numbers"),
        confirmNewPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "The new passwords you entered do not match",
        path: ["confirmNewPassword"],
    });

// ==================== 类型导出 ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof changePasswordSchema>;
