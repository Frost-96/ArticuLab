import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { ScenarioType, type ScenarioType as ScenarioTypeValue } from "../../../../../generated/prisma/enums";
import { writingErrorResponse } from "@/lib/writing/errors";
import { inferExerciseStatus } from "@/lib/writing/exerciseHelpers";
import { parseFeedback } from "@/lib/writing/feedbackTypes";

const SCENARIO_VALUES = new Set<string>(Object.values(ScenarioType));

const MAX_PAGE = 100;
const MAX_PROMPT_LENGTH = 1000;

function parseIntParam(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * 获取当前用户的写作练习列表
 *
 * 输入格式：
 * - 请求方法：GET
 * - 路径：/api/writing/exercises
 * - 请求头：Authorization: Bearer <token>  // JWT，必填
 * - 查询参数（均为可选）：
 *   {
 *     "scenarioType": "string",    // Prisma ScenarioType，按题型过滤
 *     "status": "string",          // draft | completed；draft 表示未批改，completed 表示已写入 overallScore
 *     "page": "number",            // 页码，默认 1，最大 100
 *     "limit": "number"            // 每页条数，默认 10，最大 50
 *   }
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "exercises": [
 *         {
 *           "id": "string",
 *           "scenarioType": "string",
 *           "prompt": "string",
 *           "wordCount": "number",
 *           "overallScore": "number | null",  // 已批改时为分数
 *           "status": "string",               // draft | completed
 *           "createdAt": "string",
 *           "evaluatedAt": "string | null"    // 来自 feedback._meta.evaluatedAt
 *         }
 *       ],
 *       "pagination": {
 *         "page": "number",
 *         "limit": "number",
 *         "total": "number",
 *         "totalPages": "number"
 *       },
 *       "summary": {
 *         "totalExercises": "number",         // 当前筛选条件下的总数（与 pagination.total 一致）
 *         "completedExercises": "number",     // 当前用户已批改总数（与列表筛选无关）
 *         "averageScore": "number | null",
 *         "highestScore": "number | null",
 *         "lowestScore": "number | null"
 *       }
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权（code: UNAUTHORIZED）
 * - 500：服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.isAuthenticated) {
      return writingErrorResponse("UNAUTHORIZED", "未授权访问");
    }

    const searchParams = request.nextUrl.searchParams;
    const scenarioTypeRaw = searchParams.get("scenarioType");
    const scenarioType =
      scenarioTypeRaw && SCENARIO_VALUES.has(scenarioTypeRaw)
        ? (scenarioTypeRaw as ScenarioTypeValue)
        : undefined;

    const statusFilter = searchParams.get("status");
    const page = Math.min(
      parseIntParam(searchParams.get("page"), 1),
      MAX_PAGE
    );
    const limit = Math.min(parseIntParam(searchParams.get("limit"), 10), 50);
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      scenarioType?: ScenarioTypeValue;
      overallScore?: null | { not: null };
    } = { userId: auth.userId };

    if (scenarioType) {
      where.scenarioType = scenarioType;
    }

    if (statusFilter === "draft") {
      where.overallScore = null;
    } else if (statusFilter === "completed") {
      where.overallScore = { not: null };
    }

    const [rows, total] = await Promise.all([
      prisma.writingExercise.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.writingExercise.count({ where }),
    ]);

    const exercises = rows.map((ex) => {
      const fb = parseFeedback(ex.feedback);
      return {
        id: ex.id,
        scenarioType: ex.scenarioType,
        prompt: ex.prompt,
        wordCount: ex.wordCount,
        overallScore: ex.overallScore,
        status: inferExerciseStatus(ex),
        createdAt: ex.createdAt.toISOString(),
        evaluatedAt: fb._meta?.evaluatedAt ?? null,
      };
    });

    const aggregate = await prisma.writingExercise.aggregate({
      where: { userId: auth.userId, overallScore: { not: null } },
      _count: { overallScore: true },
      _avg: { overallScore: true },
      _min: { overallScore: true },
      _max: { overallScore: true },
    });

    const completedCount = aggregate._count.overallScore;
    const summary =
      completedCount > 0
        ? {
            totalExercises: total,
            completedExercises: completedCount,
            averageScore:
              aggregate._avg.overallScore != null
                ? Math.round(aggregate._avg.overallScore * 10) / 10
                : null,
            highestScore: aggregate._max.overallScore ?? null,
            lowestScore: aggregate._min.overallScore ?? null,
          }
        : {
            totalExercises: total,
            completedExercises: 0,
            averageScore: null as number | null,
            highestScore: null as number | null,
            lowestScore: null as number | null,
          };

    return NextResponse.json({
      success: true,
      data: {
        exercises,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary,
      },
    });
  } catch (e) {
    console.error("GET /api/writing/exercises", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}

type CreateBody = {
  scenarioType?: string;
  prompt?: string;
  isCustomPrompt?: boolean;
  scenarioId?: string | null;
};

/**
 * 创建写作练习（初始为空草稿）
 *
 * 输入格式：
 * - 请求方法：POST
 * - 路径：/api/writing/exercises
 * - 请求头：
 *   - Authorization: Bearer <token>  // JWT，必填
 *   - Content-Type: application/json
 * - 请求体（JSON格式）：
 *   {
 *     "scenarioType": "string",        // Prisma ScenarioType，必填
 *     "prompt": "string",              // 题目正文，必填
 *     "isCustomPrompt": "boolean",     // 是否用户自拟题目，必填
 *     "scenarioId": "string | null"  // 可选；存在则校验 Scenario 且 type=writing；非自定义时用该场景 prompt
 *   }
 *
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "data": {
 *       "id": "string",
 *       "scenarioType": "string",
 *       "prompt": "string",
 *       "content": "string",           // 初始为空串
 *       "wordCount": "number",         // 初始为 0
 *       "status": "string",            // draft
 *       "createdAt": "string",
 *       "updatedAt": "string"         // 创建时与 createdAt 相同
 *     }
 *   }
 *
 * 错误响应：
 * - 401：未授权
 * - 400：WRITING_INVALID_INPUT（JSON 无效、字段缺失或非法）
 * - 404：WRITING_SCENARIO_NOT_FOUND（scenarioId 无效）
 * - 500：服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.isAuthenticated) {
      return writingErrorResponse("UNAUTHORIZED", "未授权访问");
    }

    let body: CreateBody;
    try {
      body = (await request.json()) as CreateBody;
    } catch {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "请求体不是合法 JSON"
      );
    }

    const { scenarioType: st, prompt, isCustomPrompt, scenarioId } = body;

    if (!st || !SCENARIO_VALUES.has(st)) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "scenarioType 无效或缺失"
      );
    }

    if (typeof prompt !== "string" || !prompt.trim()) {
      return writingErrorResponse("WRITING_INVALID_INPUT", "prompt 必填");
    }

    if (prompt.trim().length > MAX_PROMPT_LENGTH) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        `prompt 长度不能超过 ${MAX_PROMPT_LENGTH} 字符`
      );
    }

    if (typeof isCustomPrompt !== "boolean") {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "isCustomPrompt 必须为布尔值"
      );
    }

    // 校验 isCustomPrompt 与 scenarioId 的组合逻辑
    if (!isCustomPrompt && !scenarioId) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "非自定义题目时 scenarioId 必填"
      );
    }

    if (isCustomPrompt && scenarioId) {
      return writingErrorResponse(
        "WRITING_INVALID_INPUT",
        "自定义题目时不应传入 scenarioId"
      );
    }

    let resolvedPrompt = prompt.trim();
    let resolvedScenarioId: string | null =
      typeof scenarioId === "string" && scenarioId ? scenarioId : null;

    if (resolvedScenarioId) {
      const sc = await prisma.scenario.findUnique({
        where: { id: resolvedScenarioId },
      });
      if (!sc || sc.type !== "writing") {
        return writingErrorResponse(
          "WRITING_SCENARIO_NOT_FOUND",
          "场景不存在",
          resolvedScenarioId
        );
      }
      if(sc.category !== st) {
        return writingErrorResponse(
          "WRITING_SCENARIO_TYPE_MISMATCH",
          `场景类型不匹配：请求类型 ${st}，实际场景类型 ${sc.category}`,
          `scenarioId=${resolvedScenarioId}`
        );
      }
      if (!isCustomPrompt) {
        resolvedPrompt = sc.title; //题目
      }
    }

    const created = await prisma.writingExercise.create({
      data: {
        userId: auth.userId,
        scenarioType: st as ScenarioTypeValue,
        prompt: resolvedPrompt,
        isCustomPrompt,
        content: "",
        wordCount: 0,
        scenarioId: resolvedScenarioId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        scenarioType: created.scenarioType,
        prompt: created.prompt,
        content: created.content,
        wordCount: created.wordCount,
        status: "draft" as const,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("POST /api/writing/exercises", e);
    return writingErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "服务器内部错误"
    );
  }
}
