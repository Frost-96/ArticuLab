import type { MessageData } from "@/types/message/messageTypes";
import { getCoachLlmClient, getCoachLlmModel } from "./coachLlmClient";

type CoachChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CoachChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type CoachChatStreamResult =
  | {
      ok: true;
      stream: AsyncIterable<{
        choices: Array<{ delta?: { content?: string | null } }>;
      }>;
    }
  | { ok: false; error: string };

const COACH_SYSTEM_PROMPT = `You are an English coach for language learners.

Rules:
- Reply in English unless the learner asks for Chinese explanation.
- Keep responses concise and practical.
- Correct the learner's main grammar or wording issue first.
- Explain the reason briefly.
- Give one natural expression the learner can reuse.
- Ask one short follow-up question when useful.`;

function buildCoachMessages(history: MessageData[]): CoachChatMessage[] {
  const conversationMessages = history.map(
    (message): CoachChatMessage => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }),
  );

  return [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    ...conversationMessages,
  ];
}

export async function generateCoachResponse(
  conversationHistory: MessageData[],
): Promise<CoachChatResult> {
  const client = getCoachLlmClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI Coach is not configured. Please set COACH_LLM_API_KEY or SPEAKING_LLM_API_KEY.",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getCoachLlmModel(),
      messages: buildCoachMessages(conversationHistory),
      temperature: 0.4,
      max_tokens: 220,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, error: "Empty AI Coach response" };
    }

    return { ok: true, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI Coach request failed: ${message}` };
  }
}

// ==================== 流式 ====================

/**
 * 流式 AI 教练对话，逐 token 返回 ChatCompletionChunk stream
 *
 * 复用 COACH_SYSTEM_PROMPT、buildCoachMessages、客户端和模型配置。
 * 与 generateCoachResponse 的区别：
 * - stream: true，逐 token 返回
 * - 接受 AbortSignal 支持客户端中断
 * - 不设 max_tokens，由前端控制阅读节奏
 *
 * @param conversationHistory - 完整对话历史（含最新用户消息）
 * @param signal - 可选 AbortSignal，客户端断开时取消 LLM 请求
 * @returns ok:true 带 Stream，ok:false 带 error 描述
 */
export async function generateCoachResponseStream(
  conversationHistory: MessageData[],
  signal?: AbortSignal,
): Promise<CoachChatStreamResult> {
  const client = getCoachLlmClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI Coach is not configured. Please set COACH_LLM_API_KEY or SPEAKING_LLM_API_KEY.",
    };
  }

  try {
    const stream = await client.chat.completions.create(
      {
        model: getCoachLlmModel(),
        messages: buildCoachMessages(conversationHistory),
        temperature: 0.4,
        stream: true,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      },
      { signal },
    );

    return { ok: true, stream };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI Coach request failed: ${message}` };
  }
}
