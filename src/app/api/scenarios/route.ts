import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Difficulty, type Difficulty as DifficultyValue } from "../../../../generated/prisma/enums";

const WRITING_TYPE = "writing";

const DIFFICULTY_VALUES = new Set<string>(Object.values(Difficulty));

const MAX_PAGE = 100;

function parseIntParam(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * 根据 ScenarioType 获取写作题目列表
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/scenarios
 * - 查询参数（均为可选）：
 *   {
 *     "type": "string",          // writing | speaking，必填
 *     "category": "string"      // ScenarioCategory，如 ielts_task1、cet4 等，必填
 *     "difficulty": "string",    // easy | medium | hard，筛选 Scenario.difficulty；非法则忽略
 * 
 *     "page": "number",         // 页码，默认 1，最大 100
 *     "limit": "number"         // 每页条数，默认 10，最大 50
 *   }
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "prompts": [...],
 *       "pagination": {...}
 *     }
 *   }
 *
 * 错误响应：
 * - 400：缺少 type 参数或 type 非法
 * - 500：服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeRaw = searchParams.get("type");
    const categoryRaw = searchParams.get("category");

    if (!typeRaw) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "缺少 type 参数，请提供 type 值(writing/speaking)",
          },
        },
        { status: 400 }
      );
    }

    if (!categoryRaw) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "缺少 category 参数，请提供 ScenarioType",
          },
        },
        { status: 400 }
      );
    }

    const type = typeRaw as any;
    const category = categoryRaw as any;
    

    const difficultyRaw = searchParams.get("difficulty");
    const difficulty =
      difficultyRaw && DIFFICULTY_VALUES.has(difficultyRaw)
        ? (difficultyRaw as DifficultyValue)
        : undefined;

    const page = Math.min(
      parseIntParam(searchParams.get("page"), 1),
      MAX_PAGE
    );
    const limit = Math.min(parseIntParam(searchParams.get("limit"), 10), 50);
    const skip = (page - 1) * limit;

    const where = {
      type: type,
      category: category,
      ...(difficulty ? { difficulty } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.scenario.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.scenario.count({ where }),
    ]);

    const prompts = rows.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      prompt: s.prompt,
      difficulty: s.difficulty,
      estimatedWords: 120,
      estimatedMinutes: 15,
      category: s.category,
      createdAt: s.createdAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (e) {
    console.error("GET /api/writing/scenarios", e);
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
