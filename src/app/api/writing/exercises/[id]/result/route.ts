import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import { writingErrorResponse } from "@/lib/writing/errors";
import {
  findExerciseForUser,
  getFeedback,
  isGraded,
} from "@/lib/writing/exerciseHelpers";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 获取 AI 批改结果
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/exercises/{id}/result
 * - 请求头：Authorization: Bearer <token>  // JWT，必填
 * - 路径参数：id — 练习 cuid
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "id": "string",
 *       "status": "string",              // completed
 *       "scores": {
 *         "overall": "number",
 *         "grammar": "number",
 *         "vocabulary": "number",
 *         "coherence": "number",
 *         "taskCompletion": "number"
 *       },
 *       "feedback": {
 *         "summary": "string",
 *         "issues": []                   // 每条含 id、type、severity、sentence 等，见设计文档
 *       },
 *       "createdAt": "string",
 *       "submittedAt": "string | null",
 *       "evaluatedAt": "string | null",
 *       "updatedAt": "string"
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 404：WRITING_EXERCISE_NOT_FOUND
 * - 400：WRITING_RESULT_NOT_READY（尚未批改）
 * - 500：服务器内部错误
 */
export async function GET(request: NextRequest, context: Ctx) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.isAuthenticated) {
      return writingErrorResponse("UNAUTHORIZED", "未授权访问");
    }

    const { id } = await context.params;
    const ex = await findExerciseForUser(id, auth.userId);
    if (!ex) {
      return writingErrorResponse(
        "WRITING_EXERCISE_NOT_FOUND",
        "写作练习记录不存在",
        id
      );
    }

    if (!isGraded(ex)) {
      return writingErrorResponse(
        "WRITING_RESULT_NOT_READY",
        "尚未完成批改，暂无结果"
      );
    }

    const fb = getFeedback(ex);
    const scores = fb.scores ?? {
      overall: ex.overallScore ?? 0,
      grammar: ex.grammarScore ?? 0,
      vocabulary: ex.vocabularyScore ?? 0,
      coherence: ex.coherenceScore ?? 0,
      taskCompletion: ex.taskScore ?? 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        id: ex.id,
        status: "completed" as const,
        scores: {
          overall: scores.overall,
          grammar: scores.grammar,
          vocabulary: scores.vocabulary,
          coherence: scores.coherence,
          taskCompletion: scores.taskCompletion,
        },
        feedback: fb.feedback ?? {
          summary: "",
          issues: [],
        },
        createdAt: ex.createdAt.toISOString(),
        submittedAt: fb._meta?.submittedAt ?? null,
        evaluatedAt: fb._meta?.evaluatedAt ?? null,
        updatedAt: fb._meta?.evaluatedAt ?? ex.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("GET result", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
