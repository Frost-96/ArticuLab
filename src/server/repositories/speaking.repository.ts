// src/server/repositories/speaking.repository.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { SpeakingScenarioType } from "@/schema/enums";

// Select 模板定义 - 控制返回字段
const speakingExerciseSelect = {
    id: true,
    userId: true,
    scenarioId: true,
    scenarioType: true,
    scenarioRole: true,
    conversationId: true,
    status: true,
    totalTurns: true,
    durationSeconds: true,
    fluencyScore: true,
    accuracyScore: true,
    feedback: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.SpeakingExerciseSelect;

// ==================== 查询口语练习列表 ====================

/**
 * 获取口语练习列表（带分页和筛选）
 * @param userId - 用户 ID
 * @param scenarioType - 场景类型（可选）
 * @param skip - 跳过记录数
 * @param take - 获取记录数
 * @returns { rows: 练习列表，total: 总数 }
 */
export async function findSpeakingExercises(params: {
    userId: string;
    scenarioType?: string;
    skip?: number;
    take?: number;
}) {
    const { userId, scenarioType, skip = 0, take = 10 } = params;

    const where: Record<string, unknown> = {
        userId,
        isDeleted: false,
        ...(scenarioType ? { scenarioType } : {}),
    };

    const [rows, total] = await Promise.all([
        prisma.speakingExercise.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: speakingExerciseSelect,
        }),
        prisma.speakingExercise.count({ where }),
    ]);

    return { rows, total };
}

// ==================== 统计已完成练习 ====================

/**
 * 统计用户已完成的口语练习数量和平均分
 * @param userId - 用户 ID
 * @returns 统计信息
 */
export async function countCompletedSpeakingExercises(userId: string) {
    const aggregate = await prisma.speakingExercise.aggregate({
        where: { 
            userId, 
            isDeleted: false, 
            status: "completed",
            fluencyScore: { not: null },
            accuracyScore: { not: null }
        },
        _count: { id: true },
        _avg: { 
            fluencyScore: true,
            accuracyScore: true 
        },
        _min: { 
            fluencyScore: true,
            accuracyScore: true 
        },
        _max: { 
            fluencyScore: true,
            accuracyScore: true 
        },
    });

    return {
        count: aggregate._count.id,
        averageFluency: aggregate._avg.fluencyScore,
        averageAccuracy: aggregate._avg.accuracyScore,
        minFluency: aggregate._min.fluencyScore,
        maxFluency: aggregate._max.fluencyScore,
        minAccuracy: aggregate._min.accuracyScore,
        maxAccuracy: aggregate._max.accuracyScore,
    };
}

// ==================== 按 ID 查询口语练习 ====================

/**
 * 按 ID 查询口语练习
 * @param id - 练习 ID
 * @param userId - 用户 ID（用于权限校验）
 * @returns SpeakingExercise | null
 */
export async function findSpeakingExerciseById(
    id: string,
    userId: string
) {
    return prisma.speakingExercise.findFirst({
        where: { id, userId, isDeleted: false },
        select: speakingExerciseSelect,
    });
}

// ==================== 创建口语练习 ====================

/**
 * 创建口语练习（同时关联会话）
 * @param data - 练习数据
 * @returns 创建的练习
 */
export async function createSpeakingExercise(data: {
    userId: string;
    scenarioId?: string | null;
    scenarioType: string;
    scenarioRole: string;
    conversationId: string;
}) {
    return prisma.speakingExercise.create({
        data: {
            userId: data.userId,
            scenarioId: data.scenarioId,
            scenarioType: data.scenarioType as Prisma.SpeakingExerciseCreateInput["scenarioType"],
            scenarioRole: data.scenarioRole,
            conversationId: data.conversationId,
            status: "in_progress",
        },
        select: speakingExerciseSelect,
    });
}

// ==================== 更新口语练习 ====================

/**
 * 更新口语练习状态和反馈
 * @param id - 练习 ID
 * @param data - 更新数据（status、totalTurns、durationSeconds、scores、feedback）
 * @returns 更新后的练习
 */
export async function updateSpeakingExercise(
    id: string,
    data: Partial<{
        status: string;
        totalTurns: number;
        durationSeconds: number;
        fluencyScore: number | null;
        accuracyScore: number | null;
        feedback: object;
    }>
) {
    return prisma.speakingExercise.update({
        where: { id },
        data,
        select: speakingExerciseSelect,
    });
}

// ==================== 删除口语练习 ====================

/**
 * 删除口语练习（软删除）
 * @param id - 练习 ID
 * @returns 删除的练习 ID
 */
export async function deleteSpeakingExercise(id: string) {
    return prisma.speakingExercise.update({
        where: { id },
        data: {
            isDeleted: true as unknown as boolean,
        },
        select: { id: true },
    });
}


