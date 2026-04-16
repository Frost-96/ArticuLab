import { NextResponse } from "next/server";

/**
 * 写作 API 统一错误响应体（由 writingErrorResponse 生成）
 *
 * 输出格式（失败时）：
 * - 响应体（JSON格式）：
 *   {
 *     "success": false,
 *     "error": {
 *       "code": "string",        // 如 UNAUTHORIZED、WRITING_EXERCISE_NOT_FOUND
 *       "message": "string",     // 面向调用方的说明
 *       "details": "string"      // 可选，补充信息（如关联 id、上游错误文案）
 *     }
 *   }
 *
 * HTTP 状态码与 code 对应关系见 statusByCode（如 UNAUTHORIZED → 401）。
 */
export type WritingErrorCode =
  | "WRITING_SCENARIO_NOT_FOUND"
  | "WRITING_EXERCISE_NOT_FOUND"
  | "WRITING_EXERCISE_NOT_OWNER"
  | "WRITING_EXERCISE_NOT_DRAFT"
  | "WRITING_EXERCISE_ALREADY_SUBMITTED"
  | "WRITING_AI_SERVICE_UNAVAILABLE"
  | "WRITING_CONTENT_TOO_SHORT"
  | "WRITING_CONTENT_TOO_LONG"
  | "WRITING_INVALID_INPUT"
  | "WRITING_RESULT_NOT_READY"
  | "UNAUTHORIZED"
  | "WRITING_SCENARIO_TYPE_MISMATCH"
  | "INTERNAL_SERVER_ERROR";

const statusByCode: Partial<Record<WritingErrorCode, number>> = {
  WRITING_SCENARIO_NOT_FOUND: 404,
  WRITING_EXERCISE_NOT_FOUND: 404,
  WRITING_EXERCISE_NOT_OWNER: 403,
  WRITING_EXERCISE_NOT_DRAFT: 400,
  WRITING_EXERCISE_ALREADY_SUBMITTED: 400,
  WRITING_AI_SERVICE_UNAVAILABLE: 503,
  WRITING_CONTENT_TOO_SHORT: 400,
  WRITING_CONTENT_TOO_LONG: 400,
  WRITING_INVALID_INPUT: 400,
  WRITING_RESULT_NOT_READY: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
  WRITING_SCENARIO_TYPE_MISMATCH: 400,
};

/**
 * 构造写作模块标准错误 NextResponse
 *
 * 输入格式：
 * - code：WritingErrorCode
 * - message：简短错误说明
 * - details：可选，写入 error.details
 *
 * 输出格式：
 * - NextResponse，状态码由 code 映射；JSON 见文件顶部「输出格式（失败时）」
 */
export function writingErrorResponse(
  code: WritingErrorCode,
  message: string,
  details?: string
): NextResponse {
  const status = statusByCode[code] ?? 400;
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}
