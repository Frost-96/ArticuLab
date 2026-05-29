import type { MessageData } from "@/types/message/messageTypes";
import { getCoachLlmClient, getCoachLlmModel } from "./coachLlmClient";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";

type CoachChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CoachChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type CoachStreamResult =
  | {
      ok: true;
      stream: Stream<ChatCompletionChunk>;
      model: string;
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

export async function generateCoachResponseStream(
  conversationHistory: MessageData[],
  signal: AbortSignal,
): Promise<CoachStreamResult> {
  const client = getCoachLlmClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI Coach is not configured. Please set COACH_LLM_API_KEY or SPEAKING_LLM_API_KEY.",
    };
  }

  try {
    const model = getCoachLlmModel();
    const stream = await client.chat.completions.create(
      {
        model,
        messages: buildCoachMessages(conversationHistory),
        stream: true,
        temperature: 0.4,
        max_tokens: 220,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      },
      { signal },
    );

    return { ok: true, stream, model };
  } catch (error) {
    if (signal.aborted) {
      return { ok: false, error: "Streaming aborted by client" };
    }

    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI Coach streaming failed: ${message}` };
  }
}
