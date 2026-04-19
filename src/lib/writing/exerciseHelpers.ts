import { prisma } from "@/lib/prisma";
import type { WritingExercise } from "../../../generated/prisma/client";
import { parseFeedback} from "./feedbackTypes";
import type { WritingReviewResult } from "@/schema"
/**
 * 按练习 id 与用户 id 查询一条 WritingExercise（用于鉴权后读写）
 *
 * 输入格式：
 * - id：string，练习 cuid
 * - userId：string，当前登录用户 id
 *
 * 输出格式：
 * - Promise<WritingExercise | null>；无记录或越权时 null
 */
export async function findExerciseForUser(
  id: string,
  userId: string
): Promise<WritingExercise | null> {
  return prisma.writingExercise.findFirst({
    where: { id, userId },
  });
}

/**
 * 是否已完成 AI 批改（以 overallScore 是否为空为准）
 *
 * 输入格式：
 * - ex：WritingExercise
 *
 * 输出格式：
 * - boolean
 */
export function isGraded(ex: WritingExercise): boolean {
  return ex.overallScore != null;
}

/**
 * 解析当前行的 feedback 字段
 *
 * 输入格式：
 * - ex：WritingExercise
 *
 * 输出格式：
 * - WritingReviewResult | null
 */
export function getFeedback(ex: WritingExercise): WritingReviewResult | null {
  return parseFeedback(ex.feedback);
}

/**
 * 对外展示的简化状态
 *
 * 输入格式：
 * - ex：WritingExercise
 *
 * 输出格式：
 * - "draft" | "completed"
 */
export function inferExerciseStatus(
  ex: WritingExercise
): "draft" | "completed" {
  return isGraded(ex) ? "completed" : "draft";
}
