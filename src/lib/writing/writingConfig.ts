import type { WritingScenarioType } from "@/schema";

// ==================== 写作考试配置 ====================

/**
 * 各考试类型的满分值（用于归一化到 0-100 百分比）
 */
export const scoreMax: Record<WritingScenarioType, number> = {
  ielts_task1: 9,
  ielts_task2: 9,
  toefl: 30,
  cet4: 100,
  cet6: 100,
  daily: 9,
};

/**
 * 各考试类型的目标词数（用于进度条和提示）
 */
export const targetWords: Record<WritingScenarioType, number> = {
  ielts_task1: 150,
  ielts_task2: 250,
  toefl: 250,
  cet4: 150,
  cet6: 175,
  daily: 150,
};

/**
 * 将各考试类型的原始分数归一化为 0-100 百分比
 * @param scenarioType - 考试类型
 * @param score - 原始分数
 * @returns 归一化后的百分比分数（0-100）
 */
export function normalizeScore(
  scenarioType: WritingScenarioType,
  score: number,
): number {
  const max = scoreMax[scenarioType] ?? 100;
  return (score / max) * 100;
}
