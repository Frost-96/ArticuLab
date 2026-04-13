import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { writingErrorResponse } from "@/lib/writing/errors";
import {
  findExerciseForUser,
  getFeedback,
  isGraded,
} from "@/lib/writing/exerciseHelpers";
import { assessWriting } from "@/lib/writing/assessWriting";
import type { StoredWritingFeedback } from "@/lib/writing/feedbackTypes";
import { MAX_WORDS, MIN_WORDS } from "@/lib/writing/constants";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 提交作文进行 AI 批改（同步，完成后直接写入分数与 feedback）
 *
 * 输入格式：
 * - 请求方法：POST
 * - 路径：/api/writing/exercises/{id}/submit
 * - 请求头：Authorization: Bearer <token>  // JWT，必填
 * - 路径参数：id — 练习 cuid
 * - 请求体：无（使用已 PATCH 保存的 content、wordCount 及题目 prompt）
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "id": "string",
 *       "status": "string",              // completed
 *       "message": "string",
 *       "estimatedWaitTime": "number",   // 同步批改，当前为 0
 *       "submittedAt": "string",         // ISO 8601
 *       "evaluatedAt": "string"          // ISO 8601
 *       "data": {...}  
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 404：WRITING_EXERCISE_NOT_FOUND
 * - 400：WRITING_EXERCISE_ALREADY_SUBMITTED、WRITING_CONTENT_TOO_SHORT、WRITING_CONTENT_TOO_LONG
 * - 503：WRITING_AI_SERVICE_UNAVAILABLE（模型失败或 JSON 无效）
 * - 500：服务器内部错误
 */
export async function POST(request: NextRequest, context: Ctx) {
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

    if (isGraded(ex)) {
      return writingErrorResponse(
        "WRITING_EXERCISE_ALREADY_SUBMITTED",
        "练习已批改，无法重复提交"
      );
    }

    if (ex.wordCount < MIN_WORDS) {
      return writingErrorResponse(
        "WRITING_CONTENT_TOO_SHORT",
        `作文过短，至少需要 ${MIN_WORDS} 词`
      );
    }

    if (ex.wordCount > MAX_WORDS) {
      return writingErrorResponse(
        "WRITING_CONTENT_TOO_LONG",
        `作文过长，最多 ${MAX_WORDS} 词`
      );
    }

    const submittedAt = new Date().toISOString();
    const processingStartTime = Date.now(); // 毫秒级时间戳
    // 获取scenario详细信息（如果存在）
    const scenario = ex.scenarioId ? await prisma.scenario.findUnique({
      where: { id: ex.scenarioId }
    }) : null;

    const result = await assessWriting({
      scenarioType: ex.scenarioType,
      prompt: ex.prompt,
      content: ex.content,
      wordCount: ex.wordCount,
      description: scenario?.description, // 传递description（如果有）
    });

    if (!result.ok) {
      return writingErrorResponse(
        "WRITING_AI_SERVICE_UNAVAILABLE",
        "AI 批改服务暂时不可用",
        result.error
      );
    }
    const processingEndTime = Date.now();
    const actualWaitTimeMs = processingEndTime - processingStartTime;

    const prev = getFeedback(ex);
    const evaluatedAt = new Date().toISOString();
    const nextFeedback: StoredWritingFeedback = {
      ...result.data,
      _meta: {
        ...prev._meta,
        submittedAt,
        evaluatedAt,
        lastSavedAt: prev._meta?.lastSavedAt,
      },
    };

    const s = result.data.scores;
    if (!s) {
      return writingErrorResponse(
        "WRITING_AI_SERVICE_UNAVAILABLE",
        "批改结果缺少分数"
      );
    }

    const updated = await prisma.writingExercise.update({
      where: { id: ex.id },
      data: {
        overallScore: s.overall,
        grammarScore: s.grammar,
        vocabularyScore: s.vocabulary,
        coherenceScore: s.coherence,
        taskScore: s.taskCompletion,
        feedback: nextFeedback as object,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: "completed" as const,
        message: "批改已完成",
        estimatedWaitTime: actualWaitTimeMs,
        submittedAt,
        evaluatedAt,
        data: result.data,
      },
    });
  } catch (e) {
    console.error("POST submit", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
