import { NextResponse } from "next/server";
import { WRITING_SCENARIO_TYPES } from "@/lib/writing/constants";

/**
 * 获取所有写作类型的 ScenarioType 列表(exam 模式，除了daily)
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/scenarios/writingScenarioType
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "scenarioTypes": ["ielts_task1", "ielts_task2", ...]
 *     }
 *   }
 *
 * 错误响应：
 * - 500：服务器内部错误
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        scenarioTypes: WRITING_SCENARIO_TYPES,
      },
    });
  } catch (e) {
    console.error("GET /api/writing/scenarios/writingScenarioType", e);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "服务器内部错误",
        },
      },
      { status: 500 }
    );
  }
}
