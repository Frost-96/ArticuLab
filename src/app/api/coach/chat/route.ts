import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import { generateCoachResponse } from "@/lib/coach/aiCoach";
import { chatMessageSchema } from "@/schema";
import * as conversationService from "@/server/services/conversation.service";
import type { MessageData } from "@/types/message/messageTypes";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
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
        20,
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

  const coachResult = await generateCoachResponse(history, false);
  if (!coachResult.ok) {
    console.error("AI Coach failed:", coachResult.error);
    await rollbackCoachWrite(user.userId, {
      messageId: userMessage.id,
      conversationId,
      createdConversation,
    });
    return jsonError(
      getCoachFailureMessage(coachResult.error),
      coachResult.error.includes("not configured") ? 503 : 502,
    );
  }

  let assistantMessage: Awaited<
    ReturnType<typeof conversationService.saveMessage>
  >["message"];
  try {
    ({ message: assistantMessage } = await conversationService.saveMessage(
      user.userId,
      {
        conversationId,
        role: "assistant",
        content: coachResult.text,
      },
    ));
  } catch (error) {
    await rollbackCoachWrite(user.userId, {
      messageId: userMessage.id,
      conversationId,
      createdConversation,
    });
    const msg =
      error instanceof Error ? error.message : "Failed to save AI Coach reply";
    return jsonError(msg, 500);
  }

  return NextResponse.json({
    success: true,
    data: {
      conversationId,
      userMessage,
      assistantMessage,
    },
  });
}
