// src/lib/speaking/sttFlash.ts
// 腾讯云录音文件识别极速版（同步 HTTPS POST，自定义 HMAC-SHA1 签名）
//
// 与 SentenceRecognition 的区别：
// - 同步返回结果（30 分钟音频约 10 秒）
// - 支持 ≤100MB / ≤2 小时的音频
// - 使用自定义 HMAC-SHA1 签名鉴权（非 SDK 内置鉴权）
// - 请求 Body 为原始音频二进制流（application/octet-stream）
//
// 文档：https://cloud.tencent.com/document/product/1093/52097

import { createHmac } from "node:crypto";
import { getSttAppId } from "./sttClient";

/** 极速版 API 基础 URL */
const FLASH_API_BASE = "https://asr.cloud.tencent.com/asr/flash/v1";

/** 极速版 API Host */
const FLASH_API_HOST = "asr.cloud.tencent.com";

/** 请求超时（毫秒）— 30 分钟音频约 10 秒完成，设 60 秒保险 */
const FLASH_TIMEOUT_MS = 60_000;

/** 引擎模型映射（极速版支持的引擎列表） */
const FLASH_ENGINE_MAP: Record<string, string> = {
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

/** MIME 类型 → voice_format 映射 */
const FLASH_FORMAT_MAP: Record<string, string> = {
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

/** 极速版 API 响应结构 */
interface FlashResponse {
  /** 请求唯一标识 */
  request_id: string;
  /** 状态码，0 表示正常 */
  code: number;
  /** 错误消息（code 非 0 时有值） */
  message: string;
  /** 音频时长（毫秒） */
  audio_duration: number;
  /** 各声道识别结果列表 */
  flash_result: FlashChannelResult[];
}

/** 声道识别结果 */
interface FlashChannelResult {
  /** 声道完整识别文本 */
  text: string;
  /** 声道标识，从 0 开始 */
  channel_id: number;
  /** 句子/段落级别识别结果列表 */
  sentence_list: FlashSentence[];
}

/** 句子识别结果 */
interface FlashSentence {
  /** 句子文本 */
  text: string;
  /** 开始时间（毫秒） */
  start_time: number;
  /** 结束时间（毫秒） */
  end_time: number;
  /** 说话人 ID */
  speaker_id: number;
  /** 词级别识别结果列表 */
  word_list?: FlashWord[];
}

/** 词级别识别结果 */
interface FlashWord {
  /** 词文本 */
  word: string;
  /** 开始时间（毫秒） */
  start_time: number;
  /** 结束时间（毫秒） */
  end_time: number;
}

/**
 * 生成极速版 API 签名（HMAC-SHA1 + Base64）
 *
 * 签名规则（来自腾讯云文档）：
 * 1. 将所有 URL 参数按字典序排序，拼接为查询字符串
 * 2. 签名原文 = "POST" + host + path + "?" + sortedQueryString
 * 3. 用 SecretKey 对签名原文做 HMAC-SHA1 加密，再 Base64 编码
 *
 * @param secretKey - 腾讯云 SecretKey
 * @param path - API 路径（如 /asr/flash/v1/125456）
 * @param params - URL 查询参数（不含签名本身）
 * @returns Base64 编码的签名字符串
 */
function generateFlashSignature(
  secretKey: string,
  path: string,
  params: Record<string, string>,
): string {
  // 1. 参数按 key 字典序排序
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // 2. 拼接签名原文：POST + host + path + ? + queryString
  const signStr = `POST${FLASH_API_HOST}${path}?${queryString}`;
  console.log("Flash STT: signStr", signStr);

  // 3. HMAC-SHA1 + Base64
  return createHmac("sha1", secretKey).update(signStr).digest("base64");
}

/**
 * 调用腾讯云录音文件识别极速版 API（同步）
 *
 * @param audioBuffer - 音频二进制数据（≤ 100MB，≤ 2 小时）
 * @param language - 语言代码（如 "en"、"zh"），默认 "en"
 * @param mimeType - 音频 MIME 类型，默认 "audio/wav"
 * @returns 识别结果
 */
export async function flashSpeechToText(
  audioBuffer: Buffer,
  language: string = "en",
  mimeType: string = "audio/wav",
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const appId = getSttAppId();
  const secretId = process.env.TENCENT_STT_FLASH_SECRET_ID?.trim();
  const secretKey = process.env.TENCENT_STT_FLASH_SECRET_KEY?.trim();

  if (!appId || !secretId || !secretKey) {
    return { ok: false, error: "Flash STT credentials not configured" };
  }

  if (audioBuffer.length === 0) {
    return { ok: false, error: "Audio file is empty" };
  }

  // 引擎和格式映射
  const engineType = FLASH_ENGINE_MAP[language] || "16k_en";
  const cleanMime = (mimeType.split(";")[0] ?? mimeType).trim().toLowerCase();
  const voiceFormat = FLASH_FORMAT_MAP[cleanMime] || "wav";

  if (!FLASH_FORMAT_MAP[cleanMime]) {
    console.warn(
      `Flash STT: unknown MIME type "${mimeType}", falling back to wav`,
    );
  }

  // 构建 URL 查询参数
  const timestamp = Math.floor(Date.now() / 1000);
  const queryParams: Record<string, string> = {
    //appid: appId,
    secretid: secretId,
    engine_type: engineType,
    voice_format: voiceFormat,
    timestamp: String(timestamp),
    convert_num_mode: "1",
    filter_dirty: "0",
    filter_modal: "0",
    filter_punc: "0",
    first_channel_only: "1",
    speaker_diarization: "0",
    word_info: "0",
  };

  // 生成签名
  const path = `/asr/flash/v1/${appId}`;
  const signature = generateFlashSignature(secretKey, path, queryParams);

  // 构建完整 URL（参数值需 URL 编码）
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const url = `https://${FLASH_API_HOST}${path}?${queryString}`;

  // 发起 HTTPS POST 请求（Body 为原始音频二进制流）
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FLASH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Host: FLASH_API_HOST,
        Authorization: signature,
        "Content-Type": "application/octet-stream",
        "Content-Length": String(audioBuffer.length),
      },
      body: new Uint8Array(audioBuffer),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ok: false,
        error: `Flash STT HTTP error: ${response.status} ${response.statusText}`,
      };
    }

    const result = (await response.json()) as FlashResponse;

    // 检查业务错误码
    if (result.code !== 0) {
      return {
        ok: false,
        error: `Flash STT error [${result.code}]: ${result.message}`,
      };
    }

    // 提取识别文本（合并所有声道结果）
    const text = result.flash_result
      .map((channel) => channel.text)
      .join(" ")
      .trim();

    if (!text) {
      return { ok: false, error: "Empty flash recognition result" };
    }

    return { ok: true, text };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Flash STT request timeout" };
    }

    console.error("Flash STT error:", error);
    return { ok: false, error: "Flash speech recognition failed" };
  }
}
