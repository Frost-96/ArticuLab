// POST /api/speaking/chat-stream
// 流式口语对话：SSE 事件流，逐步返回 AI 文本和 TTS 音频
//
// 流程：
// 1. 流前（同步）：auth → 校验 → 加载历史 → 保存用户消息
// 2. 创建 ReadableStream：LLM stream → SentenceChunker → TtsQueue → SSE events
// 3. AbortSignal 监听：客户端断开时清理所有资源
// 4. 背压控制：TTS 队列满时暂停 LLM 消费

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { speakingChatSchema } from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";
import { generateSpeakingResponseStream } from "@/lib/speaking/aiChat";
import { SentenceChunker } from "@/lib/speaking/sentenceChunker";
import { TtsQueue } from "@/lib/speaking/ttsQueue";
import {
  encodeSSE,
  createSSEResponse,
  heartbeatSSE,
} from "@/lib/speaking/sseUtils";
import * as speakingService from "@/server/services/speaking.service";
import * as conversationService from "@/server/services/conversation.service";
import type { MessageData } from "@/types/message/messageTypes";
import { uploadAudio, deleteAudio } from "@/lib/speaking/audioStorage";
import { textToSpeech } from "@/lib/speaking/tts";

export const runtime = "nodejs";

/** 历史消息截断限制（保留最近 N 条） */
const MAX_HISTORY_MESSAGES = 20;

/** 心跳间隔（毫秒），防止反向代理超时断开 */
const HEARTBEAT_INTERVAL_MS = 15000;

const MAX_AUDIO_FILE_SIZE = 2.25 * 1024 * 1024;

/**
 * POST /api/speaking/chat-stream
 *
 * 流式口语对话端点。返回 SSE 事件流：
 * - text_delta: AI 逐 token 生成的文本
 * - sentence: 完整句子（已切分）
 * - audio_chunk: 对应句子的 TTS 音频（MP3 base64）
 * - message_saved: AI 消息已持久化
 * - done: 流结束
 * - error: 致命错误
 */
export async function POST(request: NextRequest) {
  // ============= 流前阶段（同步，可返回 JSON 错误） =============

  // 1. 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  // 2. 解析 FormData + Zod 校验文本字段
  let audio: File | null = null;
  let exerciseId: string;
  let conversationId: string;
  let message: string;

  try {
    const formData = await request.formData();
    audio = formData.get("audio") as File | null;
    exerciseId = formData.get("exerciseId") as string;
    conversationId = formData.get("conversationId") as string;
    message = formData.get("message") as string;
  } catch {
    return Response.json(
      { success: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const parsed = speakingChatSchema.safeParse({
    exerciseId,
    conversationId,
    message,
  });
  if (!parsed.success) {
    return Response.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  // 2a. 音频文件大小校验
  if (audio && audio.size > 0) {
    if (audio.size > MAX_AUDIO_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          error: `Audio file exceeds ${MAX_AUDIO_FILE_SIZE}B limit`,
        },
        { status: 413 },
      );
    }
  }

  // 3. 轻量校验 exercise 存在且属于当前用户
  let accessInfo;
  try {
    accessInfo = await speakingService.verifyExerciseAccess(
      user.userId,
      exerciseId,
      conversationId,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Exercise not found";
    const status = msg.includes("not found") ? 404 : 400;
    return Response.json({ success: false, error: msg }, { status });
  }

  // 4. 获取最近的历史消息（流式场景只需最近 N 条作为 LLM 上下文）
  let historyMessages;
  try {
    const result = await conversationService.getLatestConversationMessages(
      user.userId,
      conversationId,
      MAX_HISTORY_MESSAGES,
    );
    historyMessages = result.messages;
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to load conversation";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }

  // 5. 保存用户消息（audioUrl 先为 null，拿到 messageId 后再更新）
  let userMessageResult;
  try {
    userMessageResult = await speakingService.saveUserMessage(user.userId, {
      exerciseId,
      conversationId,
      message,
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to save user message";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }

  // 5a. 上传用户音频到 Supabase
  let userAudioPath: string | null = null;
  if (audio && audio.size > 0) {
    userAudioPath = `${user.userId}/${conversationId}/${userMessageResult.message.id}.webm`;
    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const uploadResult = await uploadAudio(
      "user-audio",
      userAudioPath,
      audioBuffer,
      audio.type || "audio/webm",
    );
    if (!uploadResult.ok) {
      // 上传失败，回滚已保存的用户消息
      try {
        await speakingService.deleteUserMessage(
          userMessageResult.message.id,
          exerciseId,
        );
      } catch (err) {
        console.error("Failed to rollback user message:", err);
      }
      return Response.json(
        { success: false, error: "Failed to upload audio" },
        { status: 500 },
      );
    }

    // 更新消息的 audioUrl 为存储路径
    await speakingService.updateMessageAudioUrl(
      userMessageResult.message.id,
      userAudioPath,
    );
  }

  // 6. 构建对话历史（历史消息已由 service 层截断 + 新用户消息）
  const history: MessageData[] = [
    ...historyMessages.map((m) => ({
      id: m.id,
      conversationId,
      role: m.role,
      content: m.content,
      audioUrl: m.audioUrl,
      createdAt: m.createdAt,
    })),
    {
      id: "null",
      conversationId,
      role: "user" as const,
      content: message,
      audioUrl: null,
      createdAt: new Date().toISOString(),
    },
  ];

  // ============= 流阶段（SSE ReadableStream） =============

  // 创建 AbortController，用于在客户端断开时清理资源
  const abortController = new AbortController();
  const { signal } = abortController;

  // 监听客户端断开
  // 先检查是否已在流前阶段提前断开（避免 abort 事件在监听器注册前已触发）
  if (request.signal.aborted) {
    // 客户端已断开，清理已上传的用户音频和已保存的用户消息
    if (userAudioPath) {
      try {
        await deleteAudio("user-audio", userAudioPath);
      } catch (err) {
        console.error("Failed to delete user audio on abort:", err);
      }
    }
    try {
      await speakingService.deleteUserMessage(
        userMessageResult.message.id,
        exerciseId,
      );
    } catch (err) {
      console.error("Failed to rollback user message:", err);
    }
    return new Response(null, { status: 499 });
  }
  request.signal.addEventListener(
    "abort",
    () => {
      abortController.abort();
    },
    { once: true },
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 发送 SSE 事件的辅助函数
      const send = (event: string, data: unknown) => {
        if (signal.aborted) return;
        try {
          controller.enqueue(encodeSSE(event, data));
        } catch {
          // controller 已关闭，忽略
        }
      };

      // 客户端已在流前阶段断开（listener 注册后、start 执行前的窗口期），无需继续
      if (signal.aborted) {
        controller.close();
        return;
      }

      // 心跳定时器，防止反向代理超时断开
      const heartbeatTimer = setInterval(() => {
        if (!signal.aborted) {
          try {
            controller.enqueue(heartbeatSSE());
          } catch {
            clearInterval(heartbeatTimer);
          }
        }
      }, HEARTBEAT_INTERVAL_MS);

      // 完整文本累积器
      let fullText = "";
      // 句子索引计数器
      let sentenceIndex = 0;

      // 初始化 TTS 队列（MP3 格式，背压阈值 10）
      const ttsQueue = new TtsQueue(
        (index, audioBase64, format) => {
          send("audio_chunk", { index, audioBase64, format });
        },
        "mp3",
        10,
      );

      // 初始化句子分块器
      const chunker = new SentenceChunker(
        (sentence) => {
          const index = sentenceIndex++;
          send("sentence", { index, text: sentence });
          const result = ttsQueue.enqueue(sentence);
          if (result !== "ok") {
            console.warn(
              `TTS enqueue unexpected for sentence ${index}: ${result}`,
            );
          }
        },
        { maxWords: 30, firstChunkTimeout: 8000, laterChunkTimeout: 30000 },
      );

      try {
        // 调用流式 LLM
        const aiResult = await generateSpeakingResponseStream(
          history,
          accessInfo.scenarioType,
          accessInfo.aiRole,
          signal,
        );

        if (!aiResult.ok) {
          send("error", { error: aiResult.error });
          send("done", { fullText: "" });
          controller.close();
          clearInterval(heartbeatTimer);
          return;
        }

        // 处理 LLM 流式 token
        for await (const chunk of aiResult.stream) {
          // 检查是否已中断
          if (signal.aborted) break;
          /* console.log(
              "LLM first chunk:",
              JSON.stringify(chunk.choices[0]?.delta)?.slice(0, 500) || "null",
            ); */
          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;

          fullText += delta;

          // 发送实时文本
          send("text_delta", { delta });

          // 背压控制：TTS 队列满时暂停 Chunker 和 LLM 消费
          // 必须在 pushText 之前检查，防止句子通过 chunker 回调发送但 TTS 入队失败
          if (ttsQueue.isFull()) {
            chunker.pause();
            await ttsQueue.waitForSpace();
            if (signal.aborted) break;
            chunker.resume();
          }

          // 推入句子分块器
          chunker.pushText(delta);
        }

        // 刷出分块器中剩余的文本
        chunker.flush();

        if (!signal.aborted) {
          // ===== 正常完成路径 =====
          if (fullText.trim()) {
            // 1. 先保存 AI 消息（audioUrl 先为 null，拿到 messageId 后再更新）
            let aiMsgResult;
            try {
              aiMsgResult = await speakingService.saveAssistantMessage(
                exerciseId,
                conversationId,
                fullText,
              );
              send("message_saved", {
                messageId: aiMsgResult.message.id,
                totalTurns: aiMsgResult.totalTurns,
              });
            } catch (error) {
              console.error("Failed to save AI message:", error);
              send("error", { error: "Failed to save AI message" });
            }

            // 2. 合成全文 TTS 并上传到 Supabase
            if (aiMsgResult) {
              const ttsResult = await textToSpeech(fullText, "Mia", 1.0, "mp3");
              if (ttsResult.ok) {
                const aiAudioPath = `${user.userId}/${conversationId}/${aiMsgResult.message.id}.mp3`;
                const uploadResult = await uploadAudio(
                  "ai-audio",
                  aiAudioPath,
                  ttsResult.audioBuffer,
                  "audio/mpeg",
                );
                if (uploadResult.ok) {
                  await speakingService.updateMessageAudioUrl(
                    aiMsgResult.message.id,
                    aiAudioPath,
                  );
                }
              }
            }
          }

          // 等待 TTS 队列全部完成
          await ttsQueue.waitForAll();

          // 发送完成事件
          send("done", { fullText });
        } else {
          // ===== 客户端断开路径 =====
          // 先 abort TTS 队列，避免 chunker.flush() 新入队的任务浪费 TTS 资源
          ttsQueue.abort();

          // 删除已上传的用户音频
          if (userAudioPath) {
            try {
              await deleteAudio("user-audio", userAudioPath);
            } catch (err) {
              console.error("Failed to delete user audio on abort:", err);
            }
          }

          // 回滚流前保存的用户消息
          try {
            await speakingService.deleteUserMessage(
              userMessageResult.message.id,
              exerciseId,
            );
          } catch (err) {
            console.error("Failed to rollback user message:", err);
          }
          // 不保存 AI 消息、不调用 waitForAll()、不发送 done 事件
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
        // 清理资源
        clearInterval(heartbeatTimer);
        chunker.destroy();
        ttsQueue.abort();
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
