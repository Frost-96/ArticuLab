import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma";

const userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    englishLevel: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

export async function createUser(data: {
    email: string;
    hashedPassword: string;
    name?: string;
}) {
    return prisma.user.create({
        data: {
            email: data.email.toLowerCase().trim(),
            password: data.hashedPassword,
            name: data.name?.trim() ?? null,
        },
        select: {
            id: true,
            email: true,
            name: true,
            englishLevel: true,
            membershipTier: true,
        },
    });
}

export async function findUserByEmail(email: string) {
    return prisma.user.findFirst({
        where: {
            email: email.toLowerCase().trim(),
            isDeleted: false,
        },
        select: userAuthSelect,
    });
}

export async function findUserById(id: string) {
    return prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        select: userAuthSelect,
    });
}
