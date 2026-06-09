// src/lib/speaking/aiChat.ts
// 口语对话 AI 聊天模块（支持非流式和流式）

import type { MessageData } from "@/types/message/messageTypes";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import { getSpeakingLlmClient, getSpeakingLlmModel } from "./speakingLlmClient";

// ============= System Prompt =============

/**
 * 构建口语对话的 system prompt（精简版，减少 token 消耗）
 *
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns system prompt 文本
 */
export function buildSystemPrompt(
  scenarioType: string,
  scenarioRole: string,
): string {
  return `You are an English speaking partner playing the role of "${scenarioRole}" in a "${scenarioType}" scenario.

Rules:
- Reply in English, natural and conversational
- Keep responses very short (2-4 sentences)
- Encourage user to continue by asking a follow-up question
- Gently correct major grammar mistakes (keep it friendly)
- Stay in character as ${scenarioRole}`;
}

// ============= 消息构建 =============

/**
 * 将对话历史转为 chat completion messages 格式
 *
 * @param history - 对话历史
 * @param systemPrompt - system prompt
 * @returns OpenAI messages 数组
 */
export function buildMessages(
  history: MessageData[],
  systemPrompt: string,
): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: systemPrompt }];

  for (const msg of history) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  return messages;
}

// ============= 非流式（保留兼容） =============

/** AI 对话结果 */
export type ChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * 生成 AI 口语对话回复（非流式）
 *
 * @param userMessage - 用户消息文本
 * @param conversationHistory - 会话历史消息
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns AI 回复结果
 */
export async function generateSpeakingResponse(
  userMessage: string,
  conversationHistory: MessageData[],
  scenarioType: string,
  scenarioRole: string,
): Promise<ChatResult> {
  const client = getSpeakingLlmClient();
  if (!client) {
    return { ok: false, error: "Speaking LLM client not configured" };
  }

  try {
    const model = getSpeakingLlmModel();
    const systemPrompt = buildSystemPrompt(scenarioType, scenarioRole);
    const messages = buildMessages(conversationHistory, systemPrompt);

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 120,
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return { ok: false, error: "Empty AI response" };
    }

    return { ok: true, text };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI chat error: ${msg}` };
  }
}

// ============= 流式版本 =============

/** AI 流式对话结果 */
export type StreamChatResult =
  | {
      ok: true;
      stream: Stream<ChatCompletionChunk>;
      model: string;
      requestId: string;
    }
  | { ok: false; error: string };

/** 流式对话可选参数 */
export interface StreamOptions {
  /** 最大生成 token 数，默认 120 */
  maxTokens?: number;
  /** 温度参数，默认 0.5 */
  temperature?: number;
  /** 存在惩罚，避免重复话题，默认 0.3 */
  presencePenalty?: number;
  /** 频率惩罚，避免重复用词，默认 0.2 */
  frequencyPenalty?: number;
}

/**
 * 生成 AI 口语对话回复（流式版本）
 *
 * 返回 OpenAI Stream 对象，支持 for await...of 迭代。
 * signal 参数必传，确保客户端断开时能及时释放资源。
 *
 * @param conversationHistory - 会话历史消息（已包含新用户消息，由 route 层截断）
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @param signal - AbortSignal，客户端断开时取消 LLM 请求（必传）
 * @param options - 可选参数（温度、token 限制等）
 * @returns 流式 completion 或错误对象
 */
export async function generateSpeakingResponseStream(
  conversationHistory: MessageData[],
  scenarioType: string,
  scenarioRole: string,
  signal: AbortSignal,
  options: StreamOptions = {},
): Promise<StreamChatResult> {
  const client = getSpeakingLlmClient();
  if (!client) {
    return { ok: false, error: "Speaking LLM client not configured" };
  }

  const {
    maxTokens = 700,
    temperature = 0.5,
    presencePenalty = 0.3,
    frequencyPenalty = 0.2,
  } = options;

  try {
    const model = getSpeakingLlmModel();
    const systemPrompt = buildSystemPrompt(scenarioType, scenarioRole);
    const messages = buildMessages(conversationHistory, systemPrompt);

    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
      },
      { signal },
    );

    // 生成简短 requestId 用于日志追踪
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return { ok: true, stream, model, requestId };
  } catch (error) {
    // 用户主动中止不当作严重错误
    if (signal.aborted) {
      return { ok: false, error: "Streaming aborted by client" };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI streaming error: ${msg}` };
  }
}
