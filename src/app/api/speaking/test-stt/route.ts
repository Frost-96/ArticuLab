// src/app/api/speaking/test-stt/route.ts
// 测试 STT API：读取服务端音频文件并调用 speechToText

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { speechToText } from "@/lib/speaking/stt";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** 允许测试的音频文件白名单 */
const ALLOWED_FILES: Record<string, { path: string; mimeType: string }> = {
  "output.wav": {
    path: "src/lib/speaking/outputAudio/output.wav",
    mimeType: "audio/wav",
  },
  "sample-speech-5m.mp3": {
    path: "src/lib/speaking/outputAudio/sample-speech-5m.mp3",
    mimeType: "audio/mpeg",
  },
};

/**
 * POST /api/speaking/test-stt
 * 测试 STT：读取服务端音频文件，调用 speechToText 并返回结果
 *
 * Content-Type: application/json
 * - filename: string（白名单中的文件名）
 * - language: string（可选，默认 "en"）
 */
export async function POST(request: NextRequest) {
  // 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 解析请求体
  let body: { filename?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const { filename, language = "en" } = body;
  if (!filename || !ALLOWED_FILES[filename]) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid filename. Allowed: ${Object.keys(ALLOWED_FILES).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const fileInfo = ALLOWED_FILES[filename];
  const filePath = resolve(process.cwd(), fileInfo.path);

  // 读取音频文件
  let audioBuffer: Buffer;
  try {
    audioBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json(
      { success: false, error: `Failed to read file: ${filename}` },
      { status: 500 },
    );
  }

  // 调用 STT
  const startTime = Date.now();
  const result = await speechToText(audioBuffer, language, fileInfo.mimeType);
  const elapsed = Date.now() - startTime;

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, elapsed },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      text: result.text,
      filename,
      fileSize: audioBuffer.length,
      elapsed,
    },
  });
}
