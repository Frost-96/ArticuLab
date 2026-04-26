import { prisma } from "@/lib/prisma";
import type { WritingExercise } from "../../../generated/prisma/client";
import type { WritingReviewResult, WritingExerciseStatus } from "@/schema"
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
/* export async function findExerciseForUser(
  id: string,
  userId: string
): Promise<WritingExercise | null> {
  return prisma.writingExercise.findFirst({
    where: { id, userId },
  });
} */
export function parseFeedback(raw: unknown): WritingReviewResult | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as WritingReviewResult;
  }
  return null;
}


export function getFeedback(ex: { feedback: unknown }): WritingReviewResult | null {
    return parseFeedback(ex.feedback);
}

export function isGraded(ex: { overallScore: number | null }): boolean {
    return ex.overallScore != null;
}

export function inferExerciseStatus(ex: { overallScore: number | null }): WritingExerciseStatus {
    return isGraded(ex) ? "completed" : "draft";
}