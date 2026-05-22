// src/lib/speaking/stt.ts
// Speech-to-Text 模块（腾讯云 ASR）

import type {
  SentenceRecognitionRequest,
  SentenceRecognitionResponse,
} from "tencentcloud-sdk-nodejs-asr/tencentcloud/services/asr/v20190614/asr_models";
import { parseBuffer } from "music-metadata";
import { getSttClient } from "./sttClient";

/** STT 调用结果 */
export type SttResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/** 音频校验结果 */
type AudioValidationResult = { ok: true } | { ok: false; error: string };

/** 腾讯云支持的音频格式 */
type SupportedVoiceFormat =
  | "wav"
  | "pcm"
  | "ogg-opus"
  | "speex"
  | "silk"
  | "mp3"
  | "m4a"
  | "aac"
  | "amr";

/** 语言 → EngSerViceType 映射（腾讯云一句话识别支持的语言） */
const ENGINE_MODEL_MAP: Record<string, string> = {
  en: "16k_en",
  zh: "16k_zh",
  ja: "16k_ja",
  ko: "16k_ko",
  vi: "16k_vi",
  ms: "16k_ms",
  id: "16k_id",
  fil: "16k_fil",
  th: "16k_th",
  pt: "16k_pt",
  tr: "16k_tr",
  ar: "16k_ar",
  es: "16k_es",
  hi: "16k_hi",
  fr: "16k_fr",
  de: "16k_de",
  yue: "16k_yue",
};

/** MIME 类型 → 腾讯云 VoiceFormat 映射（键均为小写、不含参数） */
const MIME_FORMAT_MAP: Record<string, SupportedVoiceFormat> = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "ogg-opus",
  "audio/ogg": "ogg-opus",
  "audio/opus": "ogg-opus",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/amr": "amr",
  "audio/speex": "speex",
  "audio/pcm": "pcm",
};

/** STT 超时时间（毫秒） */
const STT_TIMEOUT_MS = 15_000;

/** 腾讯云限制：Base64 编码后的音频数据 ≤ 3MB */
const MAX_BASE64_SIZE = 3 * 1024 * 1024;

/** 原始音频最大允许大小 = 3MB * 3/4 ≈ 2.25MB */
const MAX_RAW_AUDIO_SIZE = Math.floor((MAX_BASE64_SIZE * 3) / 4);

/** 音频时长上限（60 秒） */
const MAX_AUDIO_DURATION_S = 60;

/**
 * 校验音频 Buffer 的大小和时长
 * - 空 Buffer 检查
 * - 大小 ≤ 2.25MB（腾讯云 Base64 后限制 3MB）
 * - 时长 ≤ 60s（使用 music-metadata 解析）
 *
 * @param audioBuffer - 音频二进制数据
 * @param mimeType - 音频 MIME 类型，传递给 parseBuffer 辅助格式检测
 */
async function validateAudioBuffer(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<AudioValidationResult> {
  if (audioBuffer.length === 0) {
    return { ok: false, error: "Audio file is empty" };
  }
  if (audioBuffer.length > MAX_RAW_AUDIO_SIZE) {
    return { ok: false, error: "Audio file too large (max 2.25MB)" };
  }

  try {
    const metadata = await parseBuffer(audioBuffer, mimeType, {
      duration: true, // 确保获取精确时长
      skipCovers: true, // 不需要封面图片，跳过以提升性能
    });
    const duration = metadata.format.duration;
    if (duration !== undefined && duration > MAX_AUDIO_DURATION_S) {
      return {
        ok: false,
        error: `Audio too long (max ${MAX_AUDIO_DURATION_S}s)`,
      };
    }
  } catch {
    // 解析失败不阻断流程（未知格式可能无法解析时长），仅记录警告
    console.warn(
      "STT: failed to parse audio duration, skipping duration check",
    );
  }

  return { ok: true };
}

/**
 * 将音频 Buffer 转换为文本（腾讯云一句话识别 SentenceRecognition）
 *
 * @param audioBuffer - 音频二进制数据
 * @param language - 音频语言，默认 "en"，未知语言回退到 "16k_en"
 * @param mimeType - 音频 MIME 类型，默认 "audio/wav"，自动去除参数部分（如 codecs=opus）
 * @returns 识别结果
 */
export async function speechToText(
  audioBuffer: Buffer,
  language: string = "en",
  mimeType: string = "audio/wav",
): Promise<SttResult> {
  const client = getSttClient();
  if (!client) {
    return { ok: false, error: "STT client not configured" };
  }

  // 校验音频大小和时长
  const validation = await validateAudioBuffer(audioBuffer, mimeType);
  if (!validation.ok) {
    return validation;
  }

  try {
    const base64Data = audioBuffer.toString("base64");

    // 语言映射，未知语言回退到英语并记录警告
    const engSerViceType = ENGINE_MODEL_MAP[language];
    if (!engSerViceType) {
      console.warn(
        `STT: unsupported language "${language}", falling back to 16k_en`,
      );
    }

    // MIME 类型解析：去除参数部分（如 "audio/webm;codecs=opus" → "audio/webm"）
    const cleanMime = (mimeType.split(";")[0] ?? mimeType).trim().toLowerCase();
    const voiceFormat = MIME_FORMAT_MAP[cleanMime] || "wav";
    if (!MIME_FORMAT_MAP[cleanMime]) {
      console.warn(`STT: unknown MIME type "${mimeType}", falling back to wav`);
    }

    const params: SentenceRecognitionRequest = {
      EngSerViceType: engSerViceType || "16k_en",
      SourceType: 1, // 1 = 音频数据通过 Data 字段传递（Base64 编码）
      Data: base64Data,
      DataLen: audioBuffer.length, // Base64 编码前的原始数据长度（字节）
      VoiceFormat: voiceFormat,
    };

    // 带超时的 API 调用
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("STT request timeout")),
        STT_TIMEOUT_MS,
      ),
    );

    const result = (await Promise.race([
      client.SentenceRecognition(params),
      timeoutPromise,
    ])) as SentenceRecognitionResponse | undefined;

    if (!result?.Result) {
      return { ok: false, error: "Empty speech recognition result" };
    }

    return { ok: true, text: result.Result };
  } catch (error) {
    // 服务端记录完整错误（含腾讯云内部信息）
    console.error("STT error:", error);

    // 返回给用户的错误信息不暴露内部细节
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("timeout")) {
      return {
        ok: false,
        error: "Speech recognition timed out, please try again",
      };
    }
    return { ok: false, error: "Speech recognition failed" };
  }
}
