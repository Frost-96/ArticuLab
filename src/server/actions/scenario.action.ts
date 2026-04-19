"use server";

import * as scenarioService from "@/server/services/scenario.service";
import { getScenarioListSchema, type GetScenarioListInput } from "@/schema/scenario.schema";
import type { ActionResult } from "@/schema/shared.schema";
import type { ScenarioListResult } from "@/server/services/scenario.service";
//import type { ScenarioType } from "../../../generated/prisma/enums";
import type { ScenarioCategory, ScenarioType, Difficulty } from "@/schema/enums";
import { getFirstError } from "@/lib/error";

// ==================== 获取场景列表 ====================

/**
 * 获取场景列表 Action
 * @param input 筛选条件和分页参数
 * @returns ActionResult<ScenarioListResult>
 */
export async function getScenarioListAction(
    input: GetScenarioListInput
): Promise<ActionResult<ScenarioListResult>> {
    try {
        // zod 校验
        const parsed = getScenarioListSchema.safeParse(input);

        if (!parsed.success) {
            return { success: false, error: getFirstError(parsed.error) };
        }
        

        const result = await scenarioService.getScenarioList(parsed.data);
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get scenarios",
        };
    }
}

// ==================== 获取场景类型列表 ====================

/**
 * 获取口语类型列表 Action
 * @returns ActionResult<ScenarioType[]>
 */
export async function getSpeakingScenarioTypesAction(): Promise<ActionResult<ScenarioType[]>> {
    try {
        const types = await scenarioService.getSpeakingScenarioTypes();
        return { success: true, data: types };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get speaking scenario types",
        };
    }
}

/**
 * 获取写作类型列表 Action
 * @returns ActionResult<ScenarioType[]>
 */
export async function getWritingScenarioTypesAction(): Promise<ActionResult<ScenarioType[]>> {
    try {
        const types = await scenarioService.getWritingScenarioTypes();
        return { success: true, data: types };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get writing scenario types",
        };
    }
}