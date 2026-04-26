import * as scenarioRepo from "@/server/repositories/scenario.repository";
import type { ScenarioCategory, ScenarioType, SpeakingScenarioType, WritingScenarioType, Difficulty } from "@/schema/enums";
import { getScenarioListSchema, type GetScenarioListInput } from "@/schema/scenario.schema";
import type { ScenarioPrompt, ScenarioListResult } from "@/types/scenario/scenarioTypes"
import { getFirstError } from "@/lib/error";


// Repository 返回类型
type FindScenariosResult = Awaited<ReturnType<typeof scenarioRepo.findScenarios>>;

// ==================== 数据转换 ====================

function formatScenarioList(rows: FindScenariosResult["rows"]): ScenarioPrompt[] {
    return rows.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        prompt: s.prompt,
        difficulty: s.difficulty,
        estimatedWords: 120, // 默认值
        estimatedMinutes: 15, // 默认值
        category: s.category as ScenarioType,
        createdAt: s.createdAt.toISOString(),
    }));
}

// ==================== 获取场景列表 ====================

/**
 * 获取场景列表（带分页）
 * @param params 筛选条件和分页参数
 * @returns 场景列表和分页信息
 */
export async function getScenarioList(params: GetScenarioListInput): Promise<ScenarioListResult> {
// ==================== 校验输入 ====================
    const parsedParams=getScenarioListSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }
// ==================== 业务逻辑 ====================    

    const { category,scenarioType, difficulty, page, pageSize } = parsedParams.data;

    const skip = (page - 1) * pageSize;
    const { rows, total } = await scenarioRepo.findScenarios({
        type:category,
        category:scenarioType,
        difficulty,
        skip,
        take: pageSize,
    });

    const prompts = formatScenarioList(rows);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
        prompts,
        pagination: {
            page,
            limit: pageSize,
            total,
            totalPages,
        },
    };
}

// ==================== 获取场景类型列表 ====================

/**
 * 获取口语类型列表
 * @returns 口语 ScenarioType 数组
 */
export async function getSpeakingScenarioTypes(): Promise<ScenarioType[]> {
    const types = await scenarioRepo.findAllScenarioTypes("speaking");
    return [...types];
}

/**
 * 获取写作类型列表
 * @returns 写作 ScenarioType 数组
 */
export async function getWritingScenarioTypes(): Promise<ScenarioType[]> {
    const types = await scenarioRepo.findAllScenarioTypes("writing");
    return [...types];
}
