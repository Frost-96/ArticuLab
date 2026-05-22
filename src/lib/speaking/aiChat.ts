// src/lib/speaking/aiChat.ts
// 口语对话 AI 聊天模块

import type { MessageData } from "@/types/message/messageTypes";
import { getSpeakingLlmClient, getSpeakingLlmModel } from "./speakingLlmClient";

/** AI 对话结果 */
export type ChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * 构建口语对话的 system prompt
 *
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns system prompt 文本
 */
function buildSystemPrompt(scenarioType: string, scenarioRole: string): string {
  return `You are an English speaking practice partner. Your role is: ${scenarioRole}.

Scenario type: ${scenarioType}

Rules:
- Always reply in English
- Stay in character as ${scenarioRole}
- Keep responses natural and conversational (2-4 sentences)
- Encourage the user to speak more by asking follow-up questions
- If the user makes a grammar mistake, gently correct it in your reply without breaking the conversation flow
- Use vocabulary appropriate for the scenario
- Be friendly and supportive`;
}

/**
 * 将对话历史转为 chat completion messages 格式
 *
 * @param history - 对话历史
 * @param systemPrompt - system prompt
 * @returns OpenAI messages 数组
 */
function buildMessages(
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

/**
 * 生成 AI 口语对话回复
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
      temperature: 0.7,
      max_tokens: 500,
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
