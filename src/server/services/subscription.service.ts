import { getFirstError } from "@/lib/error";
import {
    cancelSubscriptionSchema,
    createSubscriptionSchema,
    deleteSubscriptionSchema,
    getSubscriptionSchema,
    getUserSubscriptionsSchema,
    updateSubscriptionSchema,
    type CancelSubscriptionInput,
    type CreateSubscriptionInput,
    type DeleteSubscriptionInput,
    type GetSubscriptionInput,
    type GetUserSubscriptionsInput,
    type SubscriptionPlan,
    type SubscriptionStatus,
    type UpdateSubscriptionInput,
} from "@/schema";
import * as subscriptionRepo from "@/server/repositories/subscription.repository";
import * as userRepo from "@/server/repositories/user.repository";

type SubscriptionRecord = NonNullable<
    Awaited<ReturnType<typeof subscriptionRepo.findSubscriptionById>>
>;

export type SubscriptionDetail = {
    id: string;
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    paymentProvider: string;
    externalId: string;
    createdAt: string;
    updatedAt: string;
};

export type SubscriptionListResult = {
    subscriptions: SubscriptionDetail[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function mapSubscription(record: SubscriptionRecord): SubscriptionDetail {
    return {
        id: record.id,
        userId: record.userId,
        plan: record.plan as SubscriptionPlan,
        status: record.status as SubscriptionStatus,
        startDate: record.startDate.toISOString(),
        endDate: record.endDate.toISOString(),
        paymentProvider: record.paymentProvider,
        externalId: record.externalId,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

async function assertUserExists(userId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }
}

export async function createSubscription(
    input: CreateSubscriptionInput,
): Promise<{ subscription: SubscriptionDetail }> {
    const parsedInput = createSubscriptionSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    await assertUserExists(parsedInput.data.userId);
    const subscription = await subscriptionRepo.createSubscription(
        parsedInput.data,
    );

    return { subscription: mapSubscription(subscription) };
}

export async function getSubscription(
    input: GetSubscriptionInput,
): Promise<{ subscription: SubscriptionDetail }> {
    const parsedInput = getSubscriptionSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const subscription = await subscriptionRepo.findSubscriptionById(
        parsedInput.data.id,
    );
    if (!subscription) {
        throw new Error("Subscription not found");
    }

    return { subscription: mapSubscription(subscription) };
}

export async function getUserSubscriptions(
    input: GetUserSubscriptionsInput,
): Promise<SubscriptionListResult> {
    const parsedInput = getUserSubscriptionsSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    await assertUserExists(parsedInput.data.userId);
    const { page, pageSize, status, userId } = parsedInput.data;
    const skip = (page - 1) * pageSize;
    const { rows, total } = await subscriptionRepo.findUserSubscriptions({
        userId,
        status,
        skip,
        take: pageSize,
    });

    return {
        subscriptions: rows.map(mapSubscription),
        pagination: {
            page,
            limit: pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
    };
}

export async function updateSubscription(
    input: UpdateSubscriptionInput,
): Promise<{ subscription: SubscriptionDetail }> {
    const parsedInput = updateSubscriptionSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await subscriptionRepo.findSubscriptionById(
        parsedInput.data.id,
    );
    if (!existing) {
        throw new Error("Subscription not found");
    }

    const startDate = parsedInput.data.startDate ?? existing.startDate;
    const endDate = parsedInput.data.endDate ?? existing.endDate;
    if (startDate > endDate) {
        throw new Error("Start date cannot be later than end date");
    }

    const { id, ...data } = parsedInput.data;
    const subscription = await subscriptionRepo.updateSubscription(id, data);

    return { subscription: mapSubscription(subscription) };
}

export async function cancelSubscription(
    input: CancelSubscriptionInput,
): Promise<{ subscription: SubscriptionDetail }> {
    const parsedInput = cancelSubscriptionSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await subscriptionRepo.findSubscriptionById(
        parsedInput.data.id,
    );
    if (!existing) {
        throw new Error("Subscription not found");
    }

    const subscription = await subscriptionRepo.cancelSubscription(existing.id);
    return { subscription: mapSubscription(subscription) };
}

export async function deleteSubscription(
    input: DeleteSubscriptionInput,
): Promise<{ id: string }> {
    const parsedInput = deleteSubscriptionSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await subscriptionRepo.findSubscriptionById(
        parsedInput.data.id,
    );
    if (!existing) {
        throw new Error("Subscription not found");
    }

    return subscriptionRepo.deleteSubscription(existing.id);
}
