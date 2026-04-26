import { prisma } from "@/lib/prisma";
import type { EnglishLevel, LearningGoal } from "@/schema";
import { Prisma } from "../../../generated/prisma/client";

const userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    englishLevel: true,
    learningGoal: true,
    membershipTier: true,
} satisfies Prisma.UserSelect;

const userProfileSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    englishLevel: true,
    learningGoal: true,
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
            englishLevel: null,
            learningGoal: null,
        },
        select: {
            id: true,
            email: true,
            name: true,
            englishLevel: true,
            learningGoal: true,
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

export async function updateUserOnboarding(data: {
    userId: string;
    englishLevel: EnglishLevel;
    learningGoal: LearningGoal;
}) {
    return prisma.user.update({
        where: {
            id: data.userId,
        },
        data: {
            englishLevel: data.englishLevel,
            learningGoal: data.learningGoal.trim(),
        },
        select: {
            id: true,
            email: true,
            name: true,
            englishLevel: true,
            learningGoal: true,
            membershipTier: true,
        },
    });
}

export async function updateUserProfile(data: {
    userId: string;
    name: string | null;
    avatar: string | null;
    englishLevel: EnglishLevel | null;
    learningGoal: LearningGoal | null;
}) {
    return prisma.user.update({
        where: {
            id: data.userId,
        },
        data: {
            name: data.name,
            avatar: data.avatar,
            englishLevel: data.englishLevel,
            learningGoal: data.learningGoal,
        },
        select: userProfileSelect,
    });
}
