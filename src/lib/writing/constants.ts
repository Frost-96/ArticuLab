import type { ScenarioType } from "../../../generated/prisma/enums";

/**
 * 写作模块常量（与提交校验、场景查询一致）
 *
 * - MIN_WORDS / MAX_WORDS：与 WritingExercise.wordCount 联动，POST submit 时校验
 * - EXAM_SCENARIO_TYPES：考试类 Scenario.category 取值列表
 * - DAILY_SCENARIO_TYPE：日常类 Scenario.category 取值（与 daily 接口查询条件一致）
 * - WRITING_SCENARIO_TYPES：写作类 ScenarioType 列表
 * - SPEAKING_SCENARIO_TYPES：口语类 ScenarioType 列表
 * - scoreRangeForScenarioType：返回 [min, max]，雅思 0–9，四六级 0–100，其余默认 0–9
 */

export const MIN_WORDS = 50;
export const MAX_WORDS = 2000;

/* export const EXAM_SCENARIO_TYPES: readonly ScenarioType[] = [
  "ielts_task1",
  "ielts_task2",
  "cet4",
  "cet6",
] as const; */

export const DAILY_SCENARIO_TYPE: ScenarioType = "daily";

export const WRITING_SCENARIO_TYPES: readonly ScenarioType[] = [
  "ielts_task1",
  "ielts_task2",
  "cet4",
  "cet6",
] as const;

export const SPEAKING_SCENARIO_TYPES: readonly ScenarioType[] = [
  "interview",
  "travel",
  "business",
] as const;

/**
 * 按场景类型返回分数区间
 *
 * 输入格式：
 * - t：ScenarioType（Prisma 枚举）
 *
 * 输出格式：
 * - [min, max]：二元组，number
 */
export function scoreRangeForScenarioType(
  t: ScenarioType
): [number, number] {
  if (t === "ielts_task1" || t === "ielts_task2") return [0, 9];
  if (t === "cet4" || t === "cet6") return [0, 100];
  return [0, 9];
}
