import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { writingErrorResponse } from "@/lib/writing/errors";
import {
  findExerciseForUser,
  getFeedback,
  isGraded,
} from "@/lib/writing/exerciseHelpers";
import { parseFeedback, type StoredWritingFeedback } from "@/lib/writing/feedbackTypes";
import { countWords } from "@/lib/writing/words";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 合并 feedback 中的 _meta，保留其余键，刷新 lastSavedAt
 *
 * 输入格式：
 * - fb：当前解析后的 StoredWritingFeedback
 * - patch：{ "lastSavedAt": "string" }
 *
 * 输出格式：
 * - 合并后的 StoredWritingFeedback
 *
 * 安全处理：当 fb._meta 为 undefined 时初始化为空对象
 */
function mergeMeta(
  fb: StoredWritingFeedback,
  patch: { lastSavedAt: string }
): StoredWritingFeedback {
  return {
    ...fb,
    _meta: { ...(fb._meta || {}), ...patch },
  };
}

/**
 * 获取写作草稿（正文与词数）
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/exercises/{id}/draft
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
 *       "content": "string",
 *       "wordCount": "number",
 *       "status": "string",           // draft | completed（已批改时仍为只读快照）
 *       "lastSavedAt": "string"      // feedback._meta.lastSavedAt，缺省为 createdAt
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
    const lastSavedAt =
      fb._meta?.lastSavedAt ?? ex.createdAt.toISOString();

    return NextResponse.json({
      success: true,
      data: {
        id: ex.id,
        content: ex.content,
        wordCount: ex.wordCount,
        status: isGraded(ex) ? "completed" : "draft",
        lastSavedAt,
      },
    });
  } catch (e) {
    console.error("GET draft", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}

/**
 * 保存写作草稿（未批改前可多次调用）
 *
 * 输入格式：
 * - 请求方法：PATCH
 * - 路径：/api/writing/exercises/{id}/draft
 * - 请求头：
 *   - Authorization: Bearer <token>  // JWT，必填
 *   - Content-Type: application/json
 * - 路径参数：id — 练习 cuid
 * - 请求体（JSON格式）：
 *   {
 *     "content": "string",    // 作文正文，必填
 *     "wordCount": "number"   // 必填；须与 content 经服务端 countWords 后大致一致（允许少量误差）
 *   }
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "id": "string",
 *       "content": "string",
 *       "wordCount": "number",
 *       "updatedAt": "string"    // 即 lastSavedAt（ISO 8601）
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 404：WRITING_EXERCISE_NOT_FOUND
 * - 400：WRITING_EXERCISE_NOT_DRAFT（已批改不可改）
 * - 400：WRITING_INVALID_INPUT（JSON 无效、类型错误、字数与正文不一致等）
 * - 500：服务器内部错误
 */
export async function PATCH(request: NextRequest, context: Ctx) {
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
        "WRITING_EXERCISE_NOT_DRAFT",
        "练习已批改完成，无法修改草稿"
      );
    }

    let body: { content?: unknown; wordCount?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "请求体不是合法 JSON"
      );
    }

    if (typeof body.content !== "string") {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "content 必须为字符串"
      );
    }

    if (typeof body.wordCount !== "number" || !Number.isFinite(body.wordCount) || body.wordCount < 0) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "wordCount 必须为非负数字"
      );
    }

    const actualWords = countWords(body.content);
    // 计算允许的误差阈值：对于小文本更宽松，对于大文本使用百分比
    const threshold = body.wordCount <= 10 ? 2 :
                     body.wordCount <= 50 ? 3 :
                     Math.max(5, Math.floor(body.wordCount * 0.1));

    if (Math.abs(actualWords - body.wordCount) > threshold) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "字数统计与内容不一致"
      );
    }

    const prev = parseFeedback(ex.feedback);
    const nextFb = mergeMeta(prev, {
      lastSavedAt: new Date().toISOString(),
    });

    const updated = await prisma.writingExercise.update({
      where: { id: ex.id },
      data: {
        content: body.content,
        wordCount: Math.floor(body.wordCount),
        feedback: nextFb as object,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        content: updated.content,
        wordCount: updated.wordCount,
        updatedAt: nextFb._meta?.lastSavedAt ?? updated.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("PATCH draft", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
