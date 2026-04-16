import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { writingErrorResponse } from "@/lib/writing/errors";
import {
  findExerciseForUser,
  getFeedback,
  inferExerciseStatus,
  isGraded,
} from "@/lib/writing/exerciseHelpers";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 获取单条写作练习详情
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/exercises/{id}
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
 *       "userId": "string",
 *       "scenarioType": "string",
 *       "prompt": "string",
 *       "isCustomPrompt": "boolean",
 *       "content": "string",
 *       "wordCount": "number",
 *       "status": "string",              // draft | completed
 *       "scores": {
 *         "overall": "number | null",
 *         "grammar": "number | null",
 *         "vocabulary": "number | null",
 *         "coherence": "number | null",
 *         "taskCompletion": "number | null"
 *       } | null,                         // 未批改时为 null
 *       "feedback": {
 *         "summary": "string",
 *         "issues": []                   // 结构见设计文档
 *       } | null,
 *       "scenarioId": "string | null",
 *       "createdAt": "string",
 *       "evaluatedAt": "string | null"
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 404：WRITING_EXERCISE_NOT_FOUND
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

    const fb = getFeedback(ex);
    const status = inferExerciseStatus(ex);

    return NextResponse.json({
      success: true,
      data: {
        id: ex.id,
        userId: ex.userId,
        scenarioType: ex.scenarioType,
        prompt: ex.prompt,
        isCustomPrompt: ex.isCustomPrompt,
        content: ex.content,
        wordCount: ex.wordCount,
        status,
        scores: isGraded(ex)
          ? {
              overall: ex.overallScore,
              grammar: ex.grammarScore,
              vocabulary: ex.vocabularyScore,
              coherence: ex.coherenceScore,
              taskCompletion: ex.taskScore,
            }
          : null,
        feedback: fb.feedback ?? null,
        scenarioId: ex.scenarioId,
        createdAt: ex.createdAt.toISOString(),
        evaluatedAt: fb._meta?.evaluatedAt ?? null,
      },
    });
  } catch (e) {
    console.error("GET /api/writing/exercises/[id]", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}

/**
 * 删除单条写作练习
 *
 * 输入格式：
 * - 请求方法：DELETE
 * - 路径：/api/writing/exercises/{id}
 * - 请求头：Authorization: Bearer <token>  // JWT，必填
 * - 路径参数：id — 练习 cuid
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "id": "string"    // 已删除的练习 id
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 404：WRITING_EXERCISE_NOT_FOUND
 * - 500：服务器内部错误
 */
export async function DELETE(request: NextRequest, context: Ctx) {
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

    await prisma.writingExercise.delete({ where: { id: ex.id } });

    return NextResponse.json({ success: true, data: { id: ex.id } });
  } catch (e) {
    console.error("DELETE /api/writing/exercises/[id]", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
