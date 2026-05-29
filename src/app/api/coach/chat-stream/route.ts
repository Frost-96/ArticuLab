// POST /api/coach/chat-stream
// 流式 AI 教练对话：SSE 事件流，逐步返回 AI 文本
//
// 流程：
// 1. 流前（同步）：auth → 校验 → 会话准备 → 保存用户消息 → 加载历史 → 作文检测
// 2. 创建 ReadableStream：LLM stream → text_delta SSE events
// 3. AbortSignal 监听：客户端断开时清理资源
//
// 与旧 /api/coach/chat 的区别：
// - SSE 流式输出替代 JSON 同步返回
// - 新增作文检测（检测到作文不进入流，直接返回 JSON）
// - 新增 AbortSignal 中断处理

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import { generateCoachResponseStream } from "@/lib/coach/aiCoach";
import { detectEssay } from "@/lib/coach/essayDetector";
import { chatMessageSchema } from "@/schema";
import * as conversationService from "@/server/services/conversation.service";
import type { MessageData } from "@/types/message/messageTypes";
import {
  encodeSSE,
  createSSEResponse,
  heartbeatSSE,
} from "@/lib/speaking/sseUtils";

export const runtime = "nodejs";

/** 历史消息截断限制（保留最近 N 条作为 LLM 上下文） */
const MAX_HISTORY_MESSAGES = 20;

/** 心跳间隔（毫秒），防止反向代理超时断开 */
const HEARTBEAT_INTERVAL_MS = 15000;

// ==================== 工具函数（从旧 route 复用） ====================

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

/**
 * 回滚已写入的教练会话数据
 *
 * 用于流前阶段出错或客户端中断时的清理。
 * 先删消息再删会话，避免孤立会话。
 */
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

// ==================== POST 入口 ====================

/**
 * POST /api/coach/chat-stream
 *
 * 流式 AI 教练对话端点。返回 SSE 事件流：
 * - text_delta: AI 逐 token 生成的文本
 * - message_saved: AI 消息已持久化
 * - done: 流结束
 * - error: 致命错误
 *
 * 作文检测返回 JSON（不进入流）：
 * - { success: true, essayDetected: true, userMessage }
 */
export async function POST(request: NextRequest) {
  // =========== 1. 鉴权 ===========

  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Unauthorized: Please login first", 401);
  }

  // =========== 2. 解析 JSON + Zod 校验 ===========

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

  // =========== 3. 会话准备（验证已有或自动创建） ===========

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
        { type: "coach", title: buildConversationTitle(message) },
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

  // =========== 4. 加载历史消息（必须在保存用户消息之前，避免当前消息重复） ===========

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
    const msg =
      error instanceof Error ? error.message : "Failed to load coach history";
    return jsonError(msg, 500);
  }

  // =========== 5. 保存用户消息 ===========

  let userMessage: Awaited<
    ReturnType<typeof conversationService.saveMessage>
  >["message"];
  try {
    ({ message: userMessage } = await conversationService.saveMessage(
      user.userId,
      { conversationId, role: "user", content: message },
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

  // =========== 6. 作文检测 ===========

  const isEssay = await detectEssay(message);
  if (isEssay) {
    return Response.json({
      success: true,
      essayDetected: true,
      userMessage,
    });
  }

  // =========== 7. 构建 LLM 上下文 ===========

  const history: MessageData[] = [
    ...historyMessages.map((item) => ({
      id: item.id,
      conversationId,
      role: item.role,
      content: item.content,
      audioUrl: item.audioUrl,
      createdAt: item.createdAt,
    })),
    {
      id: userMessage.id,
      conversationId,
      role: "user" as const,
      content: message,
      audioUrl: null,
      createdAt: userMessage.createdAt,
    },
  ];

  // =========== 8. 流阶段（SSE ReadableStream） ===========

  const abortController = new AbortController();
  const { signal } = abortController;

  // 检查流前阶段客户端已断开
  if (request.signal.aborted) {
    await rollbackCoachWrite(user.userId, {
      messageId: userMessage.id,
      conversationId,
      createdConversation,
    });
    return new Response(null, { status: 499 });
  }

  // 注册 abort 监听
  request.signal.addEventListener(
    "abort",
    () => {
      abortController.abort();
    },
    { once: true },
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // SSE 发送辅助函数
      const send = (event: string, data: unknown) => {
        if (signal.aborted) return;
        try {
          controller.enqueue(encodeSSE(event, data));
        } catch {
          // controller 已关闭，忽略
        }
      };

      // 二次检查（监听器注册后、start 执行前的窗口期）
      if (signal.aborted) {
        controller.close();
        return;
      }

      // 心跳定时器
      const heartbeatTimer = setInterval(() => {
        if (!signal.aborted) {
          try {
            controller.enqueue(heartbeatSSE());
          } catch {
            clearInterval(heartbeatTimer);
          }
        }
      }, HEARTBEAT_INTERVAL_MS);

      let fullText = "";

      try {
        // 调用流式 LLM
        const aiResult = await generateCoachResponseStream(history, signal);

        if (!aiResult.ok) {
          console.error("AI Coach failed:", aiResult.error);
          await rollbackCoachWrite(user.userId, {
            messageId: userMessage.id,
            conversationId,
            createdConversation,
          });
          send("error", { error: getCoachFailureMessage(aiResult.error) });
          send("done", { fullText: "" });
          controller.close();
          clearInterval(heartbeatTimer);
          return;
        }

        // 逐 token 消费 LLM stream
        for await (const chunk of aiResult.stream) {
          if (signal.aborted) break;
          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;
          fullText += delta;
          send("text_delta", { delta });
        }

        if (!signal.aborted) {
          // ===== 正常完成：保存 AI 消息 =====
          if (fullText.trim()) {
            try {
              const { message: assistantMessage } =
                await conversationService.saveMessage(user.userId, {
                  conversationId,
                  role: "assistant",
                  content: fullText,
                });
              send("message_saved", { messageId: assistantMessage.id });
            } catch (error) {
              console.error("Failed to save AI message:", error);
              send("error", { error: "Failed to save AI message" });
            }
          }
          send("done", { fullText });
        } else {
          // ===== 客户端断开：回滚用户消息 =====
          await rollbackCoachWrite(user.userId, {
            messageId: userMessage.id,
            conversationId,
            createdConversation,
          });
          // 不保存 AI 消息，不发送 done
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Streaming error:", error);
          const msg =
            error instanceof Error ? error.message : "Unknown streaming error";
          send("error", { error: msg });
          send("done", { fullText });
        }
      } finally {
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // 已关闭，忽略
        }
      }
    },
  });

  return createSSEResponse(stream);
}
