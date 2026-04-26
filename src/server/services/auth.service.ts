import * as userRepo from "@/server/repositories/user.repository";
import { hashPassword, comparePassword } from "@/lib/bcrypt";
import type { EnglishLevel, LearningGoal } from "@/schema";

function isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
    );
}

type AuthUser = {
    id: string;
    email: string;
    name: string | null;
    englishLevel: string | null;
    learningGoal: string | null;
    membershipTier: string;
};

// ==================== 注册 ====================

export async function registerUser(input: {
    email: string;
    password: string;
    name?: string;
}): Promise<AuthUser> {
    const hashedPassword = await hashPassword(input.password);

    try {
        const user = await userRepo.createUser({
            email: input.email,
            hashedPassword,
            name: input.name,
        });

        return user;
    } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
            throw new Error("Email already exists");
        }
        throw error;
    }
}

// ==================== 登录 ====================

export async function loginUser(input: {
    email: string;
    password: string;
}): Promise<AuthUser> {
    const user = await userRepo.findUserByEmail(input.email);

    if (!user?.password) {
        throw new Error("Invalid email or password");
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
        throw new Error("Invalid email or password");
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        englishLevel: user.englishLevel,
        learningGoal: user.learningGoal,
        membershipTier: user.membershipTier,
    };
}

export async function completeOnboarding(input: {
    userId: string;
    englishLevel: EnglishLevel;
    learningGoal: LearningGoal;
}): Promise<AuthUser> {
    const user = await userRepo.findUserById(input.userId);

    if (!user) {
        throw new Error("User not found");
    }

    return userRepo.updateUserOnboarding({
        userId: input.userId,
        englishLevel: input.englishLevel,
        learningGoal: input.learningGoal,
    });
}
