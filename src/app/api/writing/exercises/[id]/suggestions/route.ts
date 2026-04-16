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
 * 获取批改生成的改进建议与参考范文
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/exercises/{id}/suggestions
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
 *       "suggestions": [
 *         {
 *           "category": "string",
 *           "title": "string",
 *           "description": "string",
 *           "items": []                  // 元素为对象，字段见批改 JSON（如 issueId、original、improved）
 *         }
 *       ],
 *       "modelEssay": {
 *         "title": "string",
 *         "content": "string",
 *         "analysis": "string"
 *       }
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
        "尚未完成批改，暂无改进建议"
      );
    }

    const fb = getFeedback(ex);
    const sp = fb.suggestionsPayload;

    return NextResponse.json({
      success: true,
      data: {
        id: ex.id,
        suggestions: sp?.suggestions ?? [],
        modelEssay: sp?.modelEssay ?? {
          title: "",
          content: "",
          analysis: "",
        },
      },
    });
  } catch (e) {
    console.error("GET suggestions", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
