import { z } from "zod";
import { subscriptionPlanEnum, subscriptionStatusEnum } from "./enums";
import { idSchema, paginationSchema } from "./shared.schema";

export const createSubscriptionSchema = z
    .object({
        userId: idSchema,
        plan: subscriptionPlanEnum,
        status: subscriptionStatusEnum,
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        paymentProvider: z
            .string()
            .min(1, "Payment provider cannot be empty")
            .max(50, "Payment provider must not exceed 50 characters"),
        externalId: z
            .string()
            .min(1, "External id cannot be empty")
            .max(200, "External id must not exceed 200 characters"),
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: "Start date cannot be later than end date",
        path: ["endDate"],
    });

export const getSubscriptionSchema = z.object({
    id: idSchema,
});

export const getUserSubscriptionsSchema = z.object({
    userId: idSchema,
    status: subscriptionStatusEnum.optional(),
    ...paginationSchema.shape,
});

export const updateSubscriptionSchema = z
    .object({
        id: idSchema,
        plan: subscriptionPlanEnum.optional(),
        status: subscriptionStatusEnum.optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        paymentProvider: z
            .string()
            .min(1, "Payment provider cannot be empty")
            .max(50, "Payment provider must not exceed 50 characters")
            .optional(),
        externalId: z
            .string()
            .min(1, "External id cannot be empty")
            .max(200, "External id must not exceed 200 characters")
            .optional(),
    })
    .refine(
        (data) =>
            data.plan !== undefined ||
            data.status !== undefined ||
            data.startDate !== undefined ||
            data.endDate !== undefined ||
            data.paymentProvider !== undefined ||
            data.externalId !== undefined,
        {
            message: "At least one subscription field must be provided",
        },
    );

export const cancelSubscriptionSchema = z.object({
    id: idSchema,
});

export const deleteSubscriptionSchema = z.object({
    id: idSchema,
});

export type CreateSubscriptionInput = z.infer<
    typeof createSubscriptionSchema
>;
export type GetSubscriptionInput = z.infer<typeof getSubscriptionSchema>;
export type GetUserSubscriptionsInput = z.infer<
    typeof getUserSubscriptionsSchema
>;
export type UpdateSubscriptionInput = z.infer<
    typeof updateSubscriptionSchema
>;
export type CancelSubscriptionInput = z.infer<
    typeof cancelSubscriptionSchema
>;
export type DeleteSubscriptionInput = z.infer<
    typeof deleteSubscriptionSchema
>;
