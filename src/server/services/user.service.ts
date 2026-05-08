import * as userRepo from "@/server/repositories/user.repository";
import { hashPassword, comparePassword } from "@/lib/bcrypt";
import { getFirstError } from "@/lib/error";
import { 
    type EnglishLevel, 
    type UpdateProfileInput,
    type UpdatePasswordInput,
    updateProfileSchema,
    changePasswordSchema,
    idSchema,
    
} from "@/schema";

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
// ==================== 校验输入 ====================
    const parsedId=idSchema.safeParse(userId);
    if(!parsedId.success){
        throw new Error(getFirstError(parsedId.error));
    }

// ==================== 业务逻辑 ====================
    const user = await userRepo.findUserByIdFull(parsedId.data);

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
    params: UpdateProfileInput,
): Promise<UserProfile> {
// ==================== 校验输入 ====================
    const parsedId=idSchema.safeParse(userId);
    if(!parsedId.success){
        throw new Error(getFirstError(parsedId.error));
    }
    const parsedParams=updateProfileSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const user = await userRepo.findUserByIdFull(parsedId.data);

    if (!user) {
        throw new Error("User not found");
    }

    //如果什么都没改则报错，不调用repo层
    if (Object.keys(parsedParams.data).length === 0) {
        throw new Error("No update fields provided");
    }

    const updatedUser = await userRepo.updateUser(parsedId.data, parsedParams.data);

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
    params:  UpdatePasswordInput,
): Promise<void> {
// ==================== 校验输入 ====================
    const parsedId=idSchema.safeParse(userId);
    if(!parsedId.success){
        throw new Error(getFirstError(parsedId.error));
    }
    const parsedParams=changePasswordSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const user = await userRepo.findUserPasswordById(parsedId.data);

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.password) {
        throw new Error("No password set for this account");
    }

    const isValid = await comparePassword(parsedParams.data.currentPassword, user.password);
    if (!isValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(parsedParams.data.newPassword);
    await userRepo.updateUser(parsedId.data, { password: hashedPassword });
}
