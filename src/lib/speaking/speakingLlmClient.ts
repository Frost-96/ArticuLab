// src/lib/speaking/speakingLlmClient.ts
// 口语对话 LLM 客户端工厂（模块级单例，globalThis 防止 HMR 重复创建）

import OpenAI from "openai";

const globalForSpeakingLlm = globalThis as unknown as {
  speakingLlmClient: OpenAI | null | undefined;
};

/**
 * 获取口语对话 LLM 客户端（OpenAI 兼容接口，单例）
 *
 * 环境变量（优先）：
 * - SPEAKING_LLM_API_KEY：口语 LLM API Key
 * - SPEAKING_LLM_BASE_URL：口语 LLM 端点
 * - SPEAKING_LLM_MODEL：口语 LLM 模型名
 *
 * @returns OpenAI 客户端实例，未配置时返回 null
 */
export function getSpeakingLlmClient(): OpenAI | null {
  if (globalForSpeakingLlm.speakingLlmClient !== undefined) {
    return globalForSpeakingLlm.speakingLlmClient;
  }

  const apiKey = process.env.SPEAKING_LLM_API_KEY?.trim();
  if (!apiKey) {
    globalForSpeakingLlm.speakingLlmClient = null;
    return null;
  }

  const baseURL =
    process.env.SPEAKING_LLM_BASE_URL?.trim() || "https://api.deepseek.com";

  globalForSpeakingLlm.speakingLlmClient = new OpenAI({ apiKey, baseURL });
  return globalForSpeakingLlm.speakingLlmClient;
}

/**
 * 获取口语对话 LLM 模型名
 *
 * @returns 模型名字符串
 */
export function getSpeakingLlmModel(): string {
  return process.env.SPEAKING_LLM_MODEL?.trim() || "deepseek-v4-flash";
}
