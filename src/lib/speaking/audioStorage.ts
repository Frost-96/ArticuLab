// src/lib/speaking/audioStorage.ts
// 音频存储接口（现阶段返回 Base64，后续接入 Supabase Storage）

import type { AudioStorageResult } from "@/schema/speaking.schema";

/**
 * 上传音频并返回访问信息
 *
 * 现阶段实现：直接返回 Base64 data URL
 * 后续实现：上传到 Supabase Storage，返回公开访问 URL
 *
 * @param audioBuffer - 音频二进制数据
 * @param filename - 文件名（用于存储路径）
 * @param contentType - MIME 类型，默认 "audio/wav"
 * @returns 音频访问 URL 和存储标识
 */
export async function storeAudio(
  audioBuffer: Buffer,
  filename: string,
  contentType: string = "audio/wav",
): Promise<AudioStorageResult> {
  // TODO: 后续替换为 Supabase Storage 实现
  void filename;
  void contentType;

  const base64 = audioBuffer.toString("base64");
  const dataUrl = `data:audio/wav;base64,${base64}`;
  return { ok: true, url: dataUrl, storageId: "local" };
}

/**
 * 将音频 Buffer 转为 Base64 字符串
 *
 * @param buffer - 音频二进制数据
 * @returns Base64 编码字符串
 */
export function audioBufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
