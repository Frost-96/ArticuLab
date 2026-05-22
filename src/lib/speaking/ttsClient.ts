// src/lib/speaking/ttsClient.ts
// MiMo TTS 客户端工厂（模块级单例，globalThis 防止 HMR 重复创建）

import OpenAI from "openai";

const globalForTts = globalThis as unknown as {
  ttsClient: OpenAI | null | undefined;
};

/**
 * 获取 MiMo TTS 客户端（OpenAI 兼容接口，单例）
 *
 * 环境变量：
 * - TTS_API_KEY：MiMo API Key
 * - TTS_BASE_URL：MiMo API 端点，默认 https://api.xiaomimimo.com/v1
 *
 * @returns OpenAI 客户端实例，未配置时返回 null
 */
export function getTtsClient(): OpenAI | null {
  if (globalForTts.ttsClient !== undefined) {
    return globalForTts.ttsClient;
  }

  const apiKey = process.env.TTS_API_KEY?.trim();
  if (!apiKey) {
    globalForTts.ttsClient = null;
    return null;
  }

  const baseURL =
    process.env.TTS_BASE_URL?.trim() || "https://api.xiaomimimo.com/v1";

  globalForTts.ttsClient = new OpenAI({ apiKey, baseURL });
  return globalForTts.ttsClient;
}

/**
 * 获取 MiMo TTS 模型名
 *
 * @returns 模型名字符串
 */
export function getTtsModel(): string {
  return process.env.TTS_MODEL?.trim() || "mimo-v2.5-tts";
}
