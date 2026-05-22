import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitWritingSchema } from "@/schema/writing.schema";
import { getFirstError } from "@/lib/error";
import { assessWriting } from "@/lib/writing/assessWriting";
import { writingReviewResultSchema } from "@/schema/writing.schema";
import * as writingService from "@/server/services/writing.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  // 2. 解析 body + Zod 校验
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = submitWritingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  const { exerciseId, scenarioType, isCustomPrompt, prompt, content } =
    parsed.data;

  // 3. 获取 scenario 详情（用于 AI 批改的 description 字段）
  const exercise = await writingService.findExerciseById(
    exerciseId,
    user.userId,
  );
  if (!exercise) {
    return NextResponse.json(
      { success: false, error: "Writing exercise not found" },
      { status: 404 },
    );
  }

  const scenario = exercise.scenarioId
    ? await prisma.scenario.findUnique({ where: { id: exercise.scenarioId } })
    : null;

  // 4. 调用 AI 批改
  const processingStartTime = Date.now();
  const result = await assessWriting({
    scenarioType,
    prompt,
    content,
    wordCount: content.trim().split(/\s+/).length,
    description: scenario?.description,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: `AI grading failed: ${result.error}` },
      { status: 502 },
    );
  }

  const reviewParsed = writingReviewResultSchema.safeParse(result.data);
  if (!reviewParsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: `AI response format error: ${reviewParsed.error}`,
      },
      { status: 502 },
    );
  }

  const actualWaitTimeMs = Date.now() - processingStartTime;

  // 5. 调用 service 层持久化批改结果
  try {
    const saveResult = await writingService.saveWritingReview(
      user.userId,
      parsed.data,
      reviewParsed.data,
      actualWaitTimeMs,
    );

    return NextResponse.json({ success: true, data: saveResult });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save review";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
