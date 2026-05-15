import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@/schema";
import { Prisma } from "../../../generated/prisma/client";

const subscriptionSelect = {
    id: true,
    userId: true,
    plan: true,
    status: true,
    startDate: true,
    endDate: true,
    paymentProvider: true,
    externalId: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.SubscriptionSelect;

export async function createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    paymentProvider: string;
    externalId: string;
}) {
    return prisma.subscription.create({
        data: {
            userId: data.userId,
            plan: data.plan,
            status: data.status,
            startDate: data.startDate,
            endDate: data.endDate,
            paymentProvider: data.paymentProvider.trim(),
            externalId: data.externalId.trim(),
        },
        select: subscriptionSelect,
    });
}

export async function findSubscriptionById(id: string) {
    return prisma.subscription.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        select: subscriptionSelect,
    });
}

export async function findSubscriptionByExternalId(externalId: string) {
    return prisma.subscription.findFirst({
        where: {
            externalId: externalId.trim(),
            isDeleted: false,
        },
        select: subscriptionSelect,
    });
}

export async function findUserSubscriptions(params: {
    userId: string;
    status?: SubscriptionStatus;
    skip?: number;
    take?: number;
}) {
    const { userId, status, skip = 0, take = 20 } = params;
    const where: Prisma.SubscriptionWhereInput = {
        userId,
        isDeleted: false,
        ...(status ? { status } : {}),
    };

    const [rows, total] = await prisma.$transaction([
        prisma.subscription.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
            select: subscriptionSelect,
        }),
        prisma.subscription.count({ where }),
    ]);

    return { rows, total };
}

export async function updateSubscription(
    id: string,
    data: Partial<{
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        startDate: Date;
        endDate: Date;
        paymentProvider: string;
        externalId: string;
    }>,
) {
    return prisma.subscription.update({
        where: {
            id,
        },
        data: {
            ...(data.plan !== undefined && { plan: data.plan }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.startDate !== undefined && { startDate: data.startDate }),
            ...(data.endDate !== undefined && { endDate: data.endDate }),
            ...(data.paymentProvider !== undefined && {
                paymentProvider: data.paymentProvider.trim(),
            }),
            ...(data.externalId !== undefined && {
                externalId: data.externalId.trim(),
            }),
        },
        select: subscriptionSelect,
    });
}

export async function cancelSubscription(id: string) {
    return prisma.subscription.update({
        where: {
            id,
        },
        data: {
            status: "cancelled",
        },
        select: subscriptionSelect,
    });
}

export async function deleteSubscription(id: string) {
    return prisma.subscription.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
        },
        select: {
            id: true,
        },
    });
}
