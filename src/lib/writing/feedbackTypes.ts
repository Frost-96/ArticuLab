import type { WritingReviewResult } from "@/schema"


/**
 * 持久化在 WritingExercise.feedback（Json）内的结构说明（不新增表字段）
 *
 * 典型结构（JSON格式）：
 *   {
 *     "overallScore": "number",
 *     "grammarScore": "number",
 *     "vocabularyScore": "number",
 *     "coherenceScore": "number",
 *     "taskScore": "number",
 *     "overallComment": "string",
 *     "sentenceFeedback": [],           // SentenceFeedback 数组
 *     "strengths": [],                  // string 数组
 *     "improvements": [],               // string 数组
 *     "sampleExpressions": []           // 可选，SampleExpression 数组
 *   }
 */

/* export type SentenceFeedback = {
  original: string;
  corrected?: string;
  severity: "error" | "warning" | "suggestion";
  category: string; // grammar / vocabulary / coherence / task
  explanation: string;
  alternatives?: string[];
};

export type SampleExpression = {
  original: string;
  improved: string;
  explanation: string;
};
 */
/**
 * AI 批改返回的完整结果
 * 对应 schema/writing.schema.ts 中的 WritingReviewResult
 */
/* export type WritingReviewResult = {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  taskScore: number;
  overallComment: string;
  sentenceFeedback: SentenceFeedback[];
  strengths: string[];
  improvements: string[];
  sampleExpressions?: SampleExpression[];
};
 */
/**
 * 将 Prisma Json 安全转为 WritingReviewResult
 *
 * 输入格式：
 * - raw：unknown（WritingExercise.feedback）
 *
 * 输出格式：
 * - WritingReviewResult；非 object 时返回 null
 */
export function parseFeedback(raw: unknown): WritingReviewResult | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as WritingReviewResult;
  }
  return null;
}
