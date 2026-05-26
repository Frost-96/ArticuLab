import { z } from "zod";
import { englishLevelEnum, learningGoalEnum } from "./enums";

// ==================== 鐠併倛鐦夐惄绋垮�? ====================

// F-002: 闁喚顔堢€靛棛鐖滃▔銊ュ斀
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

// F-002: 闁喚顔堢€靛棛鐖滈惂璇茬秿
export const signInSchema = z.object({
  email: z.email().min(1, "Please enter your email"),
  password: z.string().min(1, "Please enter your password"),
  redirectTo: z.string().optional(),
});

// F-003: 閺傛壆鏁ら幋宄扮穿鐎?�??闁瀚ㄥ鏉戦挬閸滃瞼娲伴弽?
export const onboardingSchema = z.object({
  englishLevel: englishLevelEnum,
  learningGoal: learningGoalEnum,
});

const optionalNullableTrimmedString = (schema: z.ZodType<string | null>) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, schema.optional());

// F-003: 娑擃亙姹夌挧鍕灐缂傛牞�??
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

// 淇敼瀵嗙�?
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

// ==================== 绫诲瀷瀵煎�? ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof changePasswordSchema>;
