import { z } from "zod";
import { idSchema } from "./shared.schema";

export const emailVerificationTypeEnum = z.enum([
    "register",
    "reset_password",
]);

export const createEmailVerificationSchema = z
    .object({
        userId: idSchema,
        email: z.email(),
        token: z
            .string()
            .min(16, "Token must be at least 16 characters")
            .max(64, "Token must not exceed 64 characters"),
        type: emailVerificationTypeEnum,
        expiresAt: z.coerce.date(),
    })
    .refine((data) => data.expiresAt > new Date(), {
        message: "Expiration time must be in the future",
        path: ["expiresAt"],
    });

export const getEmailVerificationSchema = z.object({
    id: idSchema,
});

export const getEmailVerificationByTokenSchema = z.object({
    token: z
        .string()
        .min(16, "Token must be at least 16 characters")
        .max(64, "Token must not exceed 64 characters"),
});

export const markEmailVerificationUsedSchema = z.object({
    id: idSchema,
    usedAt: z.coerce.date().optional(),
});

export const deleteEmailVerificationSchema = z.object({
    id: idSchema,
});

export type EmailVerificationType = z.infer<
    typeof emailVerificationTypeEnum
>;
export type CreateEmailVerificationInput = z.infer<
    typeof createEmailVerificationSchema
>;
export type GetEmailVerificationInput = z.infer<
    typeof getEmailVerificationSchema
>;
export type GetEmailVerificationByTokenInput = z.infer<
    typeof getEmailVerificationByTokenSchema
>;
export type MarkEmailVerificationUsedInput = z.infer<
    typeof markEmailVerificationUsedSchema
>;
export type DeleteEmailVerificationInput = z.infer<
    typeof deleteEmailVerificationSchema
>;
