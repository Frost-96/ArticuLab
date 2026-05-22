// POST /api/speaking/pronunciation-local
// 读取 outputAudio 目录下的本地 WAV 文件，用 STT 转写后进行发音评估（调试用）

import { NextResponse } from "next/server";
import { assessLocalAudio } from "@/lib/speaking/pronunciation";

export async function POST() {
  const result = await assessLocalAudio();
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 502 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
