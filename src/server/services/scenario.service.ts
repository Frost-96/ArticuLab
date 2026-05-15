import * as scenarioRepo from "@/server/repositories/scenario.repository";
import type { Difficulty, ScenarioCategory, ScenarioType } from "@/schema/enums";
import {
    createScenarioSchema,
    deleteScenarioSchema,
    getScenarioListSchema,
    getScenarioSchema,
    updateScenarioSchema,
    type CreateScenarioInput,
    type DeleteScenarioInput,
    type GetScenarioInput,
    type GetScenarioListInput,
    type UpdateScenarioInput,
} from "@/schema/scenario.schema";
import type { ScenarioPrompt, ScenarioListResult } from "@/types/scenario/scenarioTypes";
import { getFirstError } from "@/lib/error";

type FindScenariosResult = Awaited<ReturnType<typeof scenarioRepo.findScenarios>>;

function formatScenarioList(rows: FindScenariosResult["rows"]): ScenarioPrompt[] {
    return rows.map((scenario) => ({
        id: scenario.id,
        type: scenario.type as ScenarioCategory,
        title: scenario.title,
        description: scenario.description,
        prompt: scenario.prompt,
        aiRole: scenario.aiRole ?? null,
        difficulty: scenario.difficulty as Difficulty,
        estimatedWords: 120,
        estimatedMinutes: 15,
        category: scenario.category as ScenarioType,
        createdAt: scenario.createdAt.toISOString(),
    }));
}

export type ScenarioDetail = ScenarioPrompt & {
    isGenerated: boolean;
    updatedAt: string;
};

function formatScenarioDetail(
    scenario: NonNullable<Awaited<ReturnType<typeof scenarioRepo.findScenarioById>>>,
): ScenarioDetail {
    return {
        id: scenario.id,
        type: scenario.type as ScenarioCategory,
        title: scenario.title,
        description: scenario.description,
        prompt: scenario.prompt,
        aiRole: scenario.aiRole ?? null,
        difficulty: scenario.difficulty as Difficulty,
        estimatedWords: 120,
        estimatedMinutes: 15,
        category: scenario.category as ScenarioType,
        isGenerated: scenario.isGenerated,
        createdAt: scenario.createdAt.toISOString(),
        updatedAt: scenario.updatedAt.toISOString(),
    };
}

export async function getScenarioList(
    params: GetScenarioListInput,
): Promise<ScenarioListResult> {
    const parsedParams = getScenarioListSchema.safeParse(params);

    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { category, scenarioType, difficulty, page, pageSize } = parsedParams.data;
    const skip = (page - 1) * pageSize;
    const { rows, total } = await scenarioRepo.findScenarios({
        type: category,
        category: scenarioType,
        difficulty,
        skip,
        take: pageSize,
    });

    return {
        prompts: formatScenarioList(rows),
        pagination: {
            page,
            limit: pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
    };
}

export async function getSpeakingScenarioTypes(): Promise<ScenarioType[]> {
    const types = await scenarioRepo.findAllScenarioTypes("speaking");
    return [...types];
}

export async function getWritingScenarioTypes(): Promise<ScenarioType[]> {
    const types = await scenarioRepo.findAllScenarioTypes("writing");
    return [...types];
}

export async function getScenario(
    input: GetScenarioInput,
): Promise<{ scenario: ScenarioDetail }> {
    const parsedInput = getScenarioSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const scenario = await scenarioRepo.findScenarioById(parsedInput.data.id);
    if (!scenario) {
        throw new Error("Scenario not found");
    }

    return { scenario: formatScenarioDetail(scenario) };
}

export async function createScenario(
    input: CreateScenarioInput,
): Promise<{ scenario: ScenarioDetail }> {
    const parsedInput = createScenarioSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const scenario = await scenarioRepo.createScenario(parsedInput.data);
    return { scenario: formatScenarioDetail(scenario) };
}

export async function updateScenario(
    input: UpdateScenarioInput,
): Promise<{ scenario: ScenarioDetail }> {
    const parsedInput = updateScenarioSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const { id, ...data } = parsedInput.data;
    const existing = await scenarioRepo.findScenarioById(id);
    if (!existing) {
        throw new Error("Scenario not found");
    }

    const scenario = await scenarioRepo.updateScenario(id, data);
    return { scenario: formatScenarioDetail(scenario) };
}

export async function deleteScenario(
    input: DeleteScenarioInput,
): Promise<{ id: string }> {
    const parsedInput = deleteScenarioSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await scenarioRepo.findScenarioById(parsedInput.data.id);
    if (!existing) {
        throw new Error("Scenario not found");
    }

    return scenarioRepo.deleteScenario(existing.id);
}
