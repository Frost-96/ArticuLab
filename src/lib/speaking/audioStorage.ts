// src/lib/speaking/audioStorage.ts
// 音频存储接口 — 基于 Supabase Storage

import { getSupabase } from "@/lib/supabase";
import type { AudioStorageResult } from "@/schema/speaking.schema";

/** 允许的 bucket 名称 */
export type AudioBucket = "user-audio" | "ai-audio";

/**
 * 上传音频文件到 Supabase Storage
 *
 * @param bucket - 目标 bucket
 * @param path - 存储路径（如 "userId/convId/msgId.webm"）
 * @param audioBuffer - 音频二进制数据
 * @param contentType - MIME 类型
 * @returns 上传结果
 */
export async function uploadAudio(
  bucket: AudioBucket,
  path: string,
  audioBuffer: Buffer,
  contentType: string,
): Promise<AudioStorageResult> {
  const { error } = await getSupabase()
    .storage.from(bucket)
    .upload(path, audioBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error(`Supabase upload failed (${bucket}/${path}):`, error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, url: path, storageId: `${bucket}/${path}` };
}

/**
 * 删除 Supabase Storage 中的音频文件
 *
 * @param bucket - 目标 bucket
 * @param path - 存储路径
 */
export async function deleteAudio(
  bucket: AudioBucket,
  path: string,
): Promise<void> {
  const { error } = await getSupabase().storage.from(bucket).remove([path]);

  if (error) {
    console.error(`Supabase delete failed (${bucket}/${path}):`, error.message);
  }
}

/**
 * 生成音频文件的签名 URL
 *
 * @param bucket - 目标 bucket
 * @param path - 存储路径
 * @param expiresIn - 有效期（秒），默认 3600
 * @returns 签名 URL
 */
export async function getSignedUrl(
  bucket: AudioBucket,
  path: string,
  expiresIn: number = 3600,
): Promise<string> {
  const { data, error } = await getSupabase()
    .storage.from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
