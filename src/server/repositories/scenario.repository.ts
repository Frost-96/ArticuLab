import { prisma } from "@/lib/prisma";
import type { ScenarioCategory, ScenarioType, Difficulty } from "@/schema/enums";
import { WRITING_SCENARIO_TYPES, SPEAKING_SCENARIO_TYPES } from "@/lib/writing/constants";

// Select 模板定义 - 控制返回字段
const scenarioSelect = {
    id: true,
    type: true,
    category: true,
    title: true,
    description: true,
    prompt: true,
    difficulty: true,
    createdAt: true,
};

// ==================== 查询场景列表 ====================

/**
 * 获取场景列表（带分页）
 * @param params 筛选条件和分页参数
 * @returns { rows: 场景列表，total: 总数 }
 */
export async function findScenarios(params: {
    type?: ScenarioCategory;
    category?: ScenarioType;
    difficulty?: Difficulty;
    skip?: number;
    take?: number;
}) {
    const { type, category, difficulty, skip = 0, take = 10 } = params;

    const where: Record<string, unknown> = {
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
    };

    const [rows, total] = await Promise.all([
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

// ==================== 查询场景类型 ====================

/**
 * 获取所有 ScenarioType 列表（按类型分类）
 * 直接返回枚举定义值，不查库
 * @param category 类型分类 (writing | speaking)
 * @returns ScenarioType 数组
 */
export async function findAllScenarioTypes(category: ScenarioCategory): Promise<readonly ScenarioType[]> {
    // 直接返回枚举值，不查数据库
    if (category === "writing") {
        return WRITING_SCENARIO_TYPES as readonly ScenarioType[];
    }
    return SPEAKING_SCENARIO_TYPES as readonly ScenarioType[];
}
