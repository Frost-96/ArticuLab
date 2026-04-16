import { NextResponse } from "next/server";
import { SPEAKING_SCENARIO_TYPES } from "@/lib/writing/constants";

/**
 * 获取所有口语类型的 ScenarioType 列表
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/scenarios/speakingScenarioType
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "scenarioTypes": [...]
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
        scenarioTypes: SPEAKING_SCENARIO_TYPES,
      },
    });
  } catch (e) {
    console.error("GET /api/writing/scenarios/speakingScenarioType", e);
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
