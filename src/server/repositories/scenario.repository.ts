import { prisma } from "@/lib/prisma";
import type { Difficulty, ScenarioCategory, ScenarioType } from "@/schema/enums";
import { speakingScenarioTypeEnum, writingScenarioTypeEnum } from "@/schema";
import { Prisma } from "../../../generated/prisma/client";

const scenarioSelect = {
    id: true,
    type: true,
    category: true,
    title: true,
    description: true,
    prompt: true,
    aiRole: true,
    difficulty: true,
    isGenerated: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function findScenarios(params: {
    type?: ScenarioCategory;
    category?: ScenarioType;
    difficulty?: Difficulty;
    skip?: number;
    take?: number;
}) {
    const { type, category, difficulty, skip = 0, take = 10 } = params;

    const where: Prisma.ScenarioWhereInput = {
        isDeleted: false,
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
    };

    const [rows, total] = await prisma.$transaction([
        prisma.scenario.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: scenarioSelect,
        }),
        prisma.scenario.count({ where }),
    ]);

    return { rows, total };
}

export async function findAllScenarioTypes(
    category: ScenarioCategory,
): Promise<readonly ScenarioType[]> {
    if (category === "writing") {
        return writingScenarioTypeEnum.options as readonly ScenarioType[];
    }

    return speakingScenarioTypeEnum.options as readonly ScenarioType[];
}

export async function findScenarioById(id: string) {
    return prisma.scenario.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        select: scenarioSelect,
    });
}

export async function createScenario(data: {
    type: ScenarioCategory;
    category: ScenarioType;
    title: string;
    description: string;
    prompt: string;
    aiRole?: string | null;
    difficulty: Difficulty;
    isGenerated?: boolean;
}) {
    return prisma.scenario.create({
        data: {
            type: data.type,
            category: data.category,
            title: data.title.trim(),
            description: data.description.trim(),
            prompt: data.prompt.trim(),
            aiRole: data.aiRole?.trim() || null,
            difficulty: data.difficulty,
            isGenerated: data.isGenerated ?? false,
        },
        select: scenarioSelect,
    });
}

export async function updateScenario(
    id: string,
    data: Partial<{
        type: ScenarioCategory;
        category: ScenarioType;
        title: string;
        description: string;
        prompt: string;
        aiRole: string | null;
        difficulty: Difficulty;
        isGenerated: boolean;
    }>,
) {
    return prisma.scenario.update({
        where: {
            id,
        },
        data: {
            ...(data.type !== undefined && { type: data.type }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.title !== undefined && { title: data.title.trim() }),
            ...(data.description !== undefined && {
                description: data.description.trim(),
            }),
            ...(data.prompt !== undefined && { prompt: data.prompt.trim() }),
            ...(data.aiRole !== undefined && {
                aiRole: data.aiRole?.trim() || null,
            }),
            ...(data.difficulty !== undefined && {
                difficulty: data.difficulty,
            }),
            ...(data.isGenerated !== undefined && {
                isGenerated: data.isGenerated,
            }),
        },
        select: scenarioSelect,
    });
}

export async function deleteScenario(id: string) {
    return prisma.scenario.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
        },
        select: {
            id: true,
        },
    });
}
