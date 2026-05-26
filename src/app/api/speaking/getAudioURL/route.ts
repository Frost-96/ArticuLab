// GET /api/speaking/getAudioURL
// 根据 bucket + path 生成 Supabase 签名 URL，用于前端播放私有 bucket 中的音频

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSignedUrl } from "@/lib/speaking/audioStorage";
import type { AudioBucket } from "@/lib/speaking/audioStorage";

/** 允许的 bucket 白名单 */
const ALLOWED_BUCKETS: AudioBucket[] = ["user-audio", "ai-audio"];

/**
 * GET /api/speaking/getAudioURL?bucket=user-audio&path=userId/convId/msgId.webm
 *
 * 校验当前用户对 path 的访问权限后，返回 Supabase 签名 URL。
 * 签名 URL 有效期 1 小时。
 */
export async function GET(request: NextRequest) {
  // 1. 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  // 2. 解析 query params
  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket");
  const path = searchParams.get("path");

  if (!bucket || !path) {
    return Response.json(
      { success: false, error: "Missing bucket or path parameter" },
      { status: 400 },
    );
  }

  // 3. Bucket 白名单校验
  if (!ALLOWED_BUCKETS.includes(bucket as AudioBucket)) {
    return Response.json(
      { success: false, error: "Invalid bucket" },
      { status: 400 },
    );
  }

  // 4. 路径归属校验（path 必须以 {userId}/ 开头）
  if (!path.startsWith(`${user.userId}/`)) {
    return Response.json(
      { success: false, error: "Access denied" },
      { status: 403 },
    );
  }

  // 5. 生成签名 URL
  try {
    const url = await getSignedUrl(bucket as AudioBucket, path);
    return Response.json({ success: true, data: { url } });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to generate URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
