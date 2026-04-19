// src/server/repositories/writing.repository.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { WritingExerciseStatus } from "@/schema/enums";

// Select 模板定义 - 控制返回字段
const writingExerciseSelect = {
    id: true,
    userId: true,
    scenarioId: true,
    scenarioType: true,
    prompt: true,
    isCustomPrompt: true,
    content: true,
    wordCount: true,
    status: true,
    overallScore: true,
    grammarScore: true,
    vocabularyScore: true,
    coherenceScore: true,
    taskScore: true,
    feedback: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.WritingExerciseSelect;

// ==================== 查询写作练习列表 ====================

/**
 * 获取写作练习列表（带分页和筛选）
 * @param userId - 用户 ID
 * @param filters - 筛选条件
 * @param filters.scenarioType - 场景类型（可选）
 * @param filters.status - 状态（可选）
 * @param skip - 跳过记录数
 * @param take - 获取记录数
 * @returns { rows: 练习列表，total: 总数 }
 */
export async function findWritingExercises(params: {
    userId: string;
    scenarioType?: string;
    status?: WritingExerciseStatus;
    skip?: number;
    take?: number;
}) {
    const { userId, scenarioType, status, skip = 0, take = 10 } = params;

    const where: Prisma.WritingExerciseWhereInput = {
        userId,
        isDeleted: false,
        ...(scenarioType ? { scenarioType } : {}),
    };

    // 状态筛选：draft 表示未批改（overallScore 为 null），completed 表示已批改
    if (status === "draft") {
        where.overallScore = null;
    } else if (status === "completed") {
        where.overallScore = { not: null };
    }

    const [rows, total] = await Promise.all([
        prisma.writingExercise.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: writingExerciseSelect,
        }),
        prisma.writingExercise.count({ where }),
    ]);

    return { rows, total };
}

// ==================== 统计已完成练习 ====================

/**
 * 统计用户已完成的练习数量和平均分
 * @param userId - 用户 ID
 * @returns 统计信息
 */
export async function countCompletedExercises(userId: string) {
    const aggregate = await prisma.writingExercise.aggregate({
        where: { userId, isDeleted: false, overallScore: { not: null } },
        _count: { overallScore: true },
        _avg: { overallScore: true },
        _min: { overallScore: true },
        _max: { overallScore: true },
    });

    return {
        count: aggregate._count.overallScore,
        average: aggregate._avg.overallScore,
        min: aggregate._min.overallScore,
        max: aggregate._max.overallScore,
    };
}

// ==================== 按 ID 查询写作练习 ====================

/**
 * 按 ID 查询写作练习
 * @param id - 练习 ID
 * @param userId - 用户 ID（用于权限校验）
 * @returns WritingExercise | null
 */
export async function findWritingExerciseById(
    id: string,
    userId: string
) {
    return prisma.writingExercise.findFirst({
        where: { id, userId, isDeleted: false },
        select: writingExerciseSelect,
    });
}

// ==================== 创建写作练习 ====================

/**
 * 创建写作练习
 * @param data - 练习数据
 * @returns 创建的练习
 */
export async function createWritingExercise(data: {
    userId: string;
    scenarioType: string;
    prompt: string;
    isCustomPrompt: boolean;
    content?: string;
    wordCount?: number;
    scenarioId?: string | null;
}) {
    return prisma.writingExercise.create({
        data: {
            userId: data.userId,
            scenarioType: data.scenarioType as Prisma.WritingExerciseCreateInput["scenarioType"],
            prompt: data.prompt,
            isCustomPrompt: data.isCustomPrompt,
            content: data.content ?? "",
            wordCount: data.wordCount ?? 0,
            scenarioId: data.scenarioId,
            status: "draft",
        },
        select: writingExerciseSelect,
    });
}

// ==================== 更新写作练习 ====================

/**
 * 更新写作练习
 * @param id - 练习 ID
 * @param data - 更新数据
 * @returns 更新后的练习
 */
export async function updateWritingExercise(
    id: string,
    data: Partial<{
        prompt: string;
        content: string;
        wordCount: number;
        feedback: object;
        overallScore: number | null;
        grammarScore: number | null;
        vocabularyScore: number | null;
        coherenceScore: number | null;
        taskScore: number | null;
    }>
) {
    return prisma.writingExercise.update({
        where: { id },
        data,
        select: writingExerciseSelect,
    });
}

// ==================== 删除写作练习 ====================

/**
 * 删除写作练习（软删除）
 * @param id - 练习 ID
 * @returns 删除的练习
 */
export async function deleteWritingExercise(id: string) {
    return prisma.writingExercise.update({
        where: { id },
        data: {
            isDeleted: true as unknown as boolean,
        },
        select: { id: true },
    });
}
