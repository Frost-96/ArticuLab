import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma";
import type { EnglishLevel } from "@/schema";

const userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    englishLevel: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

const userProfileSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    englishLevel: true,
    membershipTier: true,
    membershipExpiry: true,
    learningGoal: true,
    createdAt: true,
    updatedAt: true,
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

export async function findUserPasswordById(id: string) {
    return prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        select: {
            password: true,
        },
    });
}

export async function findUserByIdFull(id: string) {
    return prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        select: userProfileSelect,
    });
}

export async function updateUser(
    id: string,
    data: {
        name?: string | null;
        avatar?: string | null;
        password?: string | null;
        englishLevel?: EnglishLevel | null;
        learningGoal?: string | null;
    },
) {
    return prisma.user.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
            ...(data.password !== undefined && { password: data.password }),
            ...(data.englishLevel !== undefined && { englishLevel: data.englishLevel }),
            ...(data.learningGoal !== undefined && { learningGoal: data.learningGoal }),
        },
        select: userProfileSelect,
    });
}


