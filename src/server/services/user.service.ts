import * as userRepo from "@/server/repositories/user.repository";
import { hashPassword, comparePassword } from "@/lib/bcrypt";
import type { EnglishLevel } from "@/generated/prisma/enums";

type UserProfile = {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    englishLevel: string | null;
    membershipTier: string;
    membershipExpiry: string | null;
    learningGoal: string | null;
    createdAt: string;
    updatedAt: string;
};

/* type PasswordUpdateInput = {
    currentPassword: string;
    newPassword: string;
}; */

type ProfileUpdateInput = {
    name?: string;
    avatar?: string;
    //password?: PasswordUpdateInput;
    englishLevel?: EnglishLevel;
    learningGoal?: string;
};

// ==================== 获取用户信息 ====================

export async function getUserProfile(userId: string): Promise<UserProfile> {
    const user = await userRepo.findUserByIdFull(userId);

    if (!user) {
        throw new Error("User not found");
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        englishLevel: user.englishLevel,
        membershipTier: user.membershipTier,
        membershipExpiry: user.membershipExpiry?.toISOString() ?? null,
        learningGoal: user.learningGoal,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

// ==================== 更新用户信息 ====================

export async function updateUserProfile(
    userId: string,
    input: ProfileUpdateInput,
): Promise<UserProfile> {
    const user = await userRepo.findUserByIdFull(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const updateData: {
        name?: string | null;
        avatar?: string | null;
        password?: string | null;
        englishLevel?: EnglishLevel | null;
        learningGoal?: string | null;
    } = {};

    if (input.name !== undefined) {
        updateData.name = input.name.trim() || null;
    }

    if (input.avatar !== undefined) {
        updateData.avatar = input.avatar.trim() || null;
    }

    if (input.englishLevel !== undefined) {
        updateData.englishLevel = input.englishLevel;
    }

    if (input.learningGoal !== undefined) {
        updateData.learningGoal = input.learningGoal.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("No update fields provided");
    }

    const updatedUser = await userRepo.updateUser(userId, updateData);

    return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        englishLevel: updatedUser.englishLevel,
        membershipTier: updatedUser.membershipTier,
        membershipExpiry: updatedUser.membershipExpiry?.toISOString() ?? null,
        learningGoal: updatedUser.learningGoal,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
    };
}

// ==================== 修改密码 ====================

export async function updatePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
): Promise<void> {
    const user = await userRepo.findUserPasswordById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.password) {
        throw new Error("No password set for this account");
    }

    const isValid = await comparePassword(input.currentPassword, user.password);
    if (!isValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(input.newPassword);
    await userRepo.updateUser(userId, { password: hashedPassword });
}
