import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pronunciationRequestSchema } from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";
import { assessPronunciation } from "@/lib/speaking/pronunciation";
import * as speakingService from "@/server/services/speaking.service";

/** 音频文件大小上限（10MB） */
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/speaking/pronunciation
 * 对用户录音进行 Azure 发音评估，返回逐句评分结果
 *
 * Content-Type: multipart/form-data
 * - audio: File（用户录音）
 * - referenceText: string（用户确认后的转写文本）
 * - language: string（可选，默认 "en-US",指定美式发音还是英式）
 * - messageId: string（可选，关联已保存的消息）
 */
export async function POST(request: NextRequest) {
  // 1. Content-Length 前置校验
  const contentLength = parseInt(
    request.headers.get("content-length") || "0",
    10,
  );
  if (contentLength > MAX_AUDIO_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: "Payload too large" },
      { status: 413 },
    );
  }

  // 2. 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  // 3. 解析 FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Audio file is required" },
      { status: 400 },
    );
  }

  const referenceText = formData.get("referenceText");
  if (
    !referenceText ||
    typeof referenceText !== "string" ||
    !referenceText.trim()
  ) {
    return NextResponse.json(
      { success: false, error: "referenceText is required" },
      { status: 400 },
    );
  }

  // 4. Zod 校验 metadata
  const metadata = {
    language: formData.get("language") || "en-US",
    messageId: formData.get("messageId") || undefined,
    referenceText: referenceText.trim(),
  };

  const parsed = pronunciationRequestSchema.safeParse(metadata);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  // 5. 将 File 转为 Buffer
  let audioBuffer: Buffer;
  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to read audio file" },
      { status: 400 },
    );
  }

  // 6. 调用 Azure Pronunciation Assessment
  const result = await assessPronunciation(
    audioBuffer,
    parsed.data.referenceText,
    parsed.data.language,
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 502 },
    );
  }

  if (parsed.data.messageId) {
    // 7. 如果提供了 messageId，保存评估结果到 message 表
    try {
      await speakingService.savePronunciationResult(
        parsed.data.messageId,
        result.data,
      );
    } catch {
      // 保存失败不阻断返回
      console.error("Failed to save pronunciation result to message");
    }
  }

  // 8. 返回评估结果
  return NextResponse.json({
    success: true,
    data: result.data,
  });
}
