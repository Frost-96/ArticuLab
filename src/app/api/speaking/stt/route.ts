import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sttRequestSchema } from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";
import { speechToText } from "@/lib/speaking/stt";

/** 音频文件大小上限（10MB） */
const MAX_AUDIO_SIZE_BYTES = 3 * 1024 * 1024;

/**
 * POST /api/speaking/stt
 * 上传音频，返回 STT 转写文本
 *
 * Content-Type: multipart/form-data
 * - audio: File（用户录音）
 * - language: string（可选，默认 "en"）
 * - conversationId: string（可选）
 */
export async function POST(request: NextRequest) {
  // 1. Content-Length 前置校验（在解析 body 之前拒绝过大请求）
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

  // 4. Zod 校验 metadata
  const metadata = {
    language: formData.get("language") || "en",
    conversationId: formData.get("conversationId") || undefined,
  };

  const parsed = sttRequestSchema.safeParse(metadata);
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

  // 6. 调用 STT（传递文件 MIME 类型以选择正确的音频解码格式）
  const result = await speechToText(
    audioBuffer,
    parsed.data.language,
    audioFile.type,
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 502 },
    );
  }

  // 7. 返回转写文本
  return NextResponse.json({ success: true, data: { text: result.text } });
}
