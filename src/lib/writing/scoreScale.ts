import type { WritingScenarioType } from "@/schema";

// ==================== 分数配置 ====================

/**
 * 每种考试类型的分数配置
 *
 * - min / max：LLM 应输出的分数范围
 * - label：前端显示的满分标注（如 "/9"、"/100"）
 * - decimalPlaces：前端小数位数（IELTS 保留 1 位，CET 保留 0 位）
 */
export type ScoreScaleConfig = {
  min: number;
  max: number;
  label: string;
  decimalPlaces: number;
};

/** 各写作考试类型的分数配置 */
export const SCORE_SCALES: Record<WritingScenarioType, ScoreScaleConfig> = {
  ielts_task1: { min: 0, max: 9, label: "/9", decimalPlaces: 1 },
  ielts_task2: { min: 0, max: 9, label: "/9", decimalPlaces: 1 },
  toefl: { min: 0, max: 30, label: "/30", decimalPlaces: 0 },
  cet4: { min: 0, max: 100, label: "/100", decimalPlaces: 0 },
  cet6: { min: 0, max: 100, label: "/100", decimalPlaces: 0 },
  daily: { min: 0, max: 9, label: "/9", decimalPlaces: 1 },
};

// ==================== 分数转换 ====================

/**
 * 将原始分数归一化到 0-10 评分体系
 * 用于 dashboard 雷达图等需要跨类型统一比较的场景
 *
 * 输入格式：
 * - score：原始分数（0-9、0-30 或 0-100，取决于考试类型）
 * - scenarioType：考试类型
 *
 * 输出格式：
 * - 0-10 之间的数值，保留 1 位小数
 */
export function normalizeToTen(
  score: number,
  scenarioType: WritingScenarioType,
): number {
  const { max } = SCORE_SCALES[scenarioType];
  return Number(((score / max) * 10).toFixed(1));
}

/**
 * 格式化分数显示
 * 根据考试类型返回带满分标注的字符串，如 "7.5/9"、"85/100"
 *
 * 输入格式：
 * - score：原始分数（可为 null，表示未评分）
 * - scenarioType：考试类型
 *
 * 输出格式：
 * - null（score 为 null 时）
 * - "X.X/9" 或 "XX/100" 等格式字符串
 */
export function formatScore(
  score: number | null,
  scenarioType: WritingScenarioType,
): string | null {
  if (score === null) return null;
  const config = SCORE_SCALES[scenarioType];
  return `${score.toFixed(config.decimalPlaces)}${config.label}`;
}
