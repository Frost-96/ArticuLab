import { prisma } from "@/lib/prisma";
import type { EmailVerificationType } from "@/schema";
import { Prisma } from "../../../generated/prisma/client";

const emailVerificationSelect = {
    id: true,
    userId: true,
    email: true,
    token: true,
    type: true,
    expiresAt: true,
    usedAt: true,
    createdAt: true,
} satisfies Prisma.EmailVerificationSelect;

export async function createEmailVerification(data: {
    userId: string;
    email: string;
    token: string;
    type: EmailVerificationType;
    expiresAt: Date;
}) {
    return prisma.emailVerification.create({
        data: {
            userId: data.userId,
            email: data.email.toLowerCase().trim(),
            token: data.token.trim(),
            type: data.type,
            expiresAt: data.expiresAt,
        },
        select: emailVerificationSelect,
    });
}

export async function findEmailVerificationById(id: string) {
    return prisma.emailVerification.findUnique({
        where: {
            id,
        },
        select: emailVerificationSelect,
    });
}

export async function findEmailVerificationByToken(token: string) {
    return prisma.emailVerification.findUnique({
        where: {
            token: token.trim(),
        },
        select: emailVerificationSelect,
    });
}

export async function markEmailVerificationUsed(id: string, usedAt: Date) {
    return prisma.emailVerification.update({
        where: {
            id,
        },
        data: {
            usedAt,
        },
        select: emailVerificationSelect,
    });
}

export async function deleteEmailVerification(id: string) {
    return prisma.emailVerification.delete({
        where: {
            id,
        },
        select: {
            id: true,
        },
    });
}

export async function deleteExpiredEmailVerifications(now: Date) {
    return prisma.emailVerification.deleteMany({
        where: {
            expiresAt: {
                lt: now,
            },
        },
    });
}
