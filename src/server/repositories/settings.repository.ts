import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

const settingsUserSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    englishLevel: true,
    learningGoal: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

const settingsSubscriptionSelect = {
    plan: true,
    status: true,
    startDate: true,
    endDate: true,
} satisfies Prisma.SubscriptionSelect;

export async function getSettingsSourceData(userId: string) {
    const now = new Date();

    const [user, activeSubscription] = await Promise.all([
        prisma.user.findFirst({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: settingsUserSelect,
        }),
        prisma.subscription.findFirst({
            where: {
                userId,
                isDeleted: false,
                status: "active",
                startDate: {
                    lte: now,
                },
                endDate: {
                    gte: now,
                },
            },
            orderBy: {
                endDate: "desc",
            },
            select: settingsSubscriptionSelect,
        }),
    ]);

    return {
        user,
        activeSubscription,
    };
}
