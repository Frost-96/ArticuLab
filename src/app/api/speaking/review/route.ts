import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { speakingReviewRequestSchema } from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";
import { generateSpeakingReview } from "@/lib/speaking/aiReview";
import type { ReviewOptions } from "@/lib/speaking/aiReview";
import * as speakingService from "@/server/services/speaking.service";
import type { MessageData } from "@/types/message/messageTypes";

/**
 * POST /api/speaking/review
 * 对已完成的口语练习进行 AI 评估，自动保存结果到数据库
 *
 * Content-Type: application/json
 * Body: { exerciseId, score?, words?, phonemes? }
 */
export async function POST(request: NextRequest) {
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

  const parsed = speakingReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  const { exerciseId, score, words, phonemes } = parsed.data;

  // 3. 加载完整练习（含消息历史）
  let exercise;
  try {
    const result = await speakingService.getSpeakingExercise(user.userId, {
      id: exerciseId,
    });
    exercise = result.exercise;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Exercise not found";
    const status = msg.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: msg }, { status });
  }

  // 4. 检查是否已 review
  if (exercise.status === "reviewed") {
    return NextResponse.json(
      { success: false, error: "Exercise already reviewed" },
      { status: 409 },
    );
  }

  // 5. 从 exercise.messages 构建 MessageData[]
  const messages: MessageData[] = exercise.messages.map((m) => ({
    id: m.id,
    conversationId: exercise.conversationId,
    role: m.role,
    content: m.content,
    audioUrl: m.audioUrl,
    pronunciationScore: m.pronunciationScore,
    pronunciationAccuracy: m.pronunciationAccuracy,
    pronunciationFluency: m.pronunciationFluency,
    pronunciationCompleteness: m.pronunciationCompleteness,
    pronunciationProsody: m.pronunciationProsody,
    pronunciationFeedback: m.pronunciationFeedback,
    createdAt: m.createdAt,
  }));

  // 6. 构建 ReviewOptions
  const options: ReviewOptions = { score, words, phonemes };

  // 7. 调用 AI 生成评估
  const reviewResult = await generateSpeakingReview(
    messages,
    exercise.scenarioType,
    exercise.aiRole,
    options,
  );

  if (!reviewResult.ok) {
    console.error("AI review failed:", reviewResult.error);
    return NextResponse.json(
      { success: false, error: reviewResult.error },
      { status: 502 },
    );
  }

  // 8. 保存评估结果到数据库
  try {
    await speakingService.updateSpeakingExercise(user.userId, {
      id: exerciseId,
      feedback: reviewResult.data,
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to save review";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  // 9. 返回评估结果
  return NextResponse.json({
    success: true,
    data: reviewResult.data,
  });
}
