import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import { generateCoachResponseStream } from "@/lib/coach/aiCoach";
import { chatMessageSchema } from "@/schema";
import {
  createSSEResponse,
  encodeSSE,
  heartbeatSSE,
} from "@/lib/speaking/sseUtils";
import * as conversationService from "@/server/services/conversation.service";
import type { MessageData } from "@/types/message/messageTypes";

export const runtime = "nodejs";

const HEARTBEAT_INTERVAL_MS = 15000;
const MAX_HISTORY_MESSAGES = 20;

function jsonError(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

function buildConversationTitle(message: string) {
  const trimmed = message.trim();
  return trimmed.length > 100 ? `${trimmed.slice(0, 97).trim()}...` : trimmed;
}

function getCoachFailureMessage(error: string) {
  if (error.includes("not configured")) {
    return "AI Coach service is temporarily unavailable. Please try again later.";
  }

  if (error.includes("Empty AI Coach response")) {
    return "AI Coach returned an empty response. Please try again.";
  }

  return "AI Coach could not respond right now. Please try again.";
}

async function rollbackCoachWrite(
  userId: string,
  input: {
    messageId?: string | null;
    conversationId?: string | null;
    createdConversation: boolean;
  },
) {
  if (input.messageId) {
    await conversationService
      .deleteMessage(userId, { id: input.messageId })
      .catch((error) => {
        console.error("Failed to roll back coach user message:", error);
      });
  }

  if (input.createdConversation && input.conversationId) {
    await conversationService
      .deleteConversation(userId, { id: input.conversationId })
      .catch((error) => {
        console.error("Failed to roll back coach conversation:", error);
      });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Unauthorized: Please login first", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(getFirstError(parsed.error), 400);
  }

  const { conversationId: inputConversationId, message } = parsed.data;
  if (!message.trim()) {
    return jsonError("Message cannot be empty", 400);
  }

  let conversationId = inputConversationId ?? null;
  let createdConversation = false;

  try {
    if (conversationId) {
      const { conversation } = await conversationService.getConversation(
        user.userId,
        { id: conversationId },
      );
      if (conversation.type !== "coach") {
        return jsonError("Conversation is not an AI Coach session", 400);
      }
    } else {
      const { conversation } = await conversationService.createConversation(
        user.userId,
        {
          type: "coach",
          title: buildConversationTitle(message),
        },
      );
      conversationId = conversation.id;
      createdConversation = true;
    }
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to prepare coach chat";
    const status = msg.includes("not found") ? 404 : 400;
    return jsonError(msg, status);
  }

  if (!conversationId) {
    return jsonError("Failed to prepare coach chat", 500);
  }

  let userMessage: Awaited<
    ReturnType<typeof conversationService.saveMessage>
  >["message"];
  try {
    ({ message: userMessage } = await conversationService.saveMessage(
      user.userId,
      {
        conversationId,
        role: "user",
        content: message,
      },
    ));
  } catch (error) {
    await rollbackCoachWrite(user.userId, {
      conversationId,
      createdConversation,
    });
    const msg =
      error instanceof Error ? error.message : "Failed to save user message";
    return jsonError(msg, 500);
  }

  let historyMessages: Awaited<
    ReturnType<typeof conversationService.getLatestConversationMessages>
  >["messages"];
  try {
    ({ messages: historyMessages } =
      await conversationService.getLatestConversationMessages(
        user.userId,
        conversationId,
        MAX_HISTORY_MESSAGES,
      ));
  } catch (error) {
    await rollbackCoachWrite(user.userId, {
      messageId: userMessage.id,
      conversationId,
      createdConversation,
    });
    const msg =
      error instanceof Error ? error.message : "Failed to load coach history";
    return jsonError(msg, 500);
  }

  const history: MessageData[] = historyMessages.map((item) => ({
    id: item.id,
    conversationId: item.conversationId,
    role: item.role,
    content: item.content,
    audioUrl: item.audioUrl,
    createdAt: item.createdAt,
  }));

  const abortController = new AbortController();
  const { signal } = abortController;

  if (request.signal.aborted) {
    await rollbackCoachWrite(user.userId, {
      messageId: userMessage.id,
      conversationId,
      createdConversation,
    });
    return new Response(null, { status: 499 });
  }

  request.signal.addEventListener("abort", () => abortController.abort(), {
    once: true,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (signal.aborted) return;

        try {
          controller.enqueue(encodeSSE(event, data));
        } catch {
          // Ignore writes after the stream closes.
        }
      };

      const heartbeatTimer = setInterval(() => {
        if (signal.aborted) return;

        try {
          controller.enqueue(heartbeatSSE());
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);

      let fullText = "";
      let shouldRollback = true;

      try {
        const coachResult = await generateCoachResponseStream(history, signal);
        if (!coachResult.ok) {
          await rollbackCoachWrite(user.userId, {
            messageId: userMessage.id,
            conversationId,
            createdConversation,
          });
          shouldRollback = false;

          // 作文检测命中：提示用户前往写作批改页面
          if ("essayDetected" in coachResult) {
            send("essay_detected", {
              message:
                "It looks like you submitted an essay. Please use the Writing Practice page for detailed feedback.",
            });
            send("done", { fullText: "" });
            return;
          }

          send("error", { error: getCoachFailureMessage(coachResult.error) });
          send("done", { fullText: "" });
          return;
        }

        for await (const chunk of coachResult.stream) {
          if (signal.aborted) break;

          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;

          fullText += delta;
          send("text_delta", { delta });
        }

        if (signal.aborted) {
          if (shouldRollback) {
            await rollbackCoachWrite(user.userId, {
              messageId: userMessage.id,
              conversationId,
              createdConversation,
            });
            shouldRollback = false;
          }
          return;
        }

        if (!fullText.trim()) {
          await rollbackCoachWrite(user.userId, {
            messageId: userMessage.id,
            conversationId,
            createdConversation,
          });
          shouldRollback = false;
          send("error", {
            error: getCoachFailureMessage("Empty AI Coach response"),
          });
          send("done", { fullText: "" });
          return;
        }

        const { message: assistantMessage } =
          await conversationService.saveMessage(user.userId, {
            conversationId,
            role: "assistant",
            content: fullText,
          });
        shouldRollback = false;

        send("message_saved", {
          conversationId,
          userMessage,
          assistantMessage,
        });
        send("done", { fullText });
      } catch (error) {
        if (!signal.aborted) {
          console.error("AI Coach streaming failed:", error);
          if (shouldRollback) {
            await rollbackCoachWrite(user.userId, {
              messageId: userMessage.id,
              conversationId,
              createdConversation,
            });
            shouldRollback = false;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Unknown coach stream error";
          send("error", { error: getCoachFailureMessage(message) });
          send("done", { fullText });
        }
      } finally {
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Ignore already closed streams.
        }
      }
    },
  });

  return createSSEResponse(stream);
}
