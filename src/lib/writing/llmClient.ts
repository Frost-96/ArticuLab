/**
 * 写作批改 LLM 客户端（OpenAI 兼容 baseURL）
 *
 * 环境变量：
 * - WRITING_LLM_API_KEY：未设置或空时 getWritingLlmClient 返回 null（上层走 Mock）
 * - WRITING_LLM_BASE_URL：可选，默认 https://api.openai.com/v1
 * - WRITING_LLM_MODEL：可选，默认 gpt-4o-mini
 */
import OpenAI from "openai";

/**
 * 获取 OpenAI SDK 实例（用于 chat.completions）
 *
 * 输入格式：
 * - 无（读取 process.env）
 *
 * 输出格式：
 * - OpenAI | null
 */
export function getWritingLlmClient(): OpenAI | null {
  const apiKey = process.env.WRITING_LLM_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL =
    process.env.WRITING_LLM_BASE_URL?.trim() || "https://api.openai.com/v1";

  return new OpenAI({ apiKey, baseURL });
}

/**
 * 获取默认模型名
 *
 * 输出格式：
 * - string
 */
export function getWritingLlmModel(): string {
  return process.env.WRITING_LLM_MODEL?.trim() || "gpt-4o-mini";
}
