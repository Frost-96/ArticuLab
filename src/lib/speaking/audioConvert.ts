// src/lib/speaking/audioConvert.ts
// 音频格式转换工具 — 将各种音频格式统一转为 PCM

import { existsSync } from "node:fs";
import { PassThrough } from "node:stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

/** 设置 ffmpeg 二进制路径：优先 ffmpeg-static，不存在则用系统 ffmpeg */
if (ffmpegStatic && existsSync(ffmpegStatic)) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
// 否则 fluent-ffmpeg 会从系统 PATH 中查找 ffmpeg

/** ffmpeg 转换超时时间（毫秒） */
const FFMPEG_TIMEOUT_MS = 30_000;

/** ffmpeg 可用性缓存 */
let ffmpegAvailable: boolean | null = null;

/**
 * 检查 ffmpeg 是否可用（结果缓存）
 */
async function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  return new Promise((resolve) => {
    ffmpeg({ source: "pipe:0" })
      .on("error", () => {
        ffmpegAvailable = false;
        resolve(false);
      })
      .on("start", () => {
        ffmpegAvailable = true;
        resolve(true);
      })
      .format("null")
      .pipe();
  });
}

/** PCM 输出格式参数 */
export interface PcmFormat {
  /** 采样率，默认 16000 */
  sampleRate?: number;
  /** 声道数，默认 1 */
  channels?: number;
  /** 编码格式，默认 "pcm_s16le" */
  codec?: string;
}

/**
 * 用 ffmpeg 将任意音频 Buffer 转为指定格式的 PCM
 *
 * @param buffer - 原始音频 Buffer（支持 wav, webm, ogg, mp3 等常见格式）
 * @param format - 输出 PCM 格式参数
 * @returns PCM Buffer
 * @throws ffmpeg 不可用、转换失败、超时或输入为空时抛出异常
 */
export async function convertToPcm(
  buffer: Buffer,
  format?: PcmFormat,
): Promise<Buffer> {
  if (buffer.length === 0) {
    throw new Error("Audio buffer is empty");
  }

  const sampleRate = format?.sampleRate ?? 16000;
  const channels = format?.channels ?? 1;
  const codec = format?.codec ?? "pcm_s16le";

  // 检查 ffmpeg 是否可用
  const available = await checkFfmpegAvailable();
  if (!available) {
    throw new Error(
      "ffmpeg binary not available. Check ffmpeg-static installation.",
    );
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    // 超时控制
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new Error(`ffmpeg conversion timed out after ${FFMPEG_TIMEOUT_MS}ms`),
        );
      }
    }, FFMPEG_TIMEOUT_MS);

    const finish = (error?: Error, data?: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else if (!data || data.length === 0) {
        reject(new Error("ffmpeg produced empty PCM output"));
      } else {
        resolve(data);
      }
    };

    try {
      const inputStream = new PassThrough();
      inputStream.end(buffer);

      const outputStream = ffmpeg(inputStream)
        .audioFrequency(sampleRate)
        .audioChannels(channels)
        .audioCodec(codec)
        .format("s16le")
        .on("error", (err: Error) => {
          finish(new Error(`ffmpeg audio conversion failed: ${err.message}`));
        })
        .pipe();

      outputStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      outputStream.on("end", () => {
        finish(undefined, Buffer.concat(chunks));
      });
      outputStream.on("error", (err: Error) => {
        finish(new Error(`ffmpeg output stream error: ${err.message}`));
      });
    } catch (err) {
      finish(
        new Error(
          `ffmpeg invocation failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  });
}
