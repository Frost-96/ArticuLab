import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import { deleteAudio, uploadAudio } from "@/lib/speaking/audioStorage";
import { generateSpeakingResponseStream } from "@/lib/speaking/aiChat";
import { SentenceChunker } from "@/lib/speaking/sentenceChunker";
import {
  createSSEResponse,
  encodeSSE,
  heartbeatSSE,
} from "@/lib/speaking/sseUtils";
import { textToSpeech } from "@/lib/speaking/tts";
import { TtsQueue } from "@/lib/speaking/ttsQueue";
import { speakingChatSchema } from "@/schema/speaking.schema";
import * as conversationService from "@/server/services/conversation.service";
import * as speakingService from "@/server/services/speaking.service";
import type { MessageData } from "@/types/message/messageTypes";

export const runtime = "nodejs";

const HEARTBEAT_INTERVAL_MS = 15000;
const MAX_AUDIO_FILE_SIZE = 2.25 * 1024 * 1024;
const MAX_HISTORY_MESSAGES = 20;

function getSpeakingAiFailureMessage(error: string) {
  if (error.includes("not configured")) {
    return "Speaking AI service is temporarily unavailable. Please try again later.";
  }

  if (error.includes("Empty AI response")) {
    return "Speaking AI returned an empty response. Please try again.";
  }

  return "Speaking AI could not respond right now. Please try again.";
}

async function rollbackUserMessage(input: {
  messageId: string;
  exerciseId: string;
  userAudioPath: string | null;
}) {
  if (input.userAudioPath) {
    try {
      await deleteAudio("user-audio", input.userAudioPath);
    } catch (error) {
      console.error("Failed to delete user audio:", error);
    }
  }

  try {
    await speakingService.deleteUserMessage(input.messageId, input.exerciseId);
  } catch (error) {
    console.error("Failed to rollback user message:", error);
  }
}

async function persistAssistantAudio(input: {
  userId: string;
  conversationId: string;
  messageId: string;
  text: string;
}) {
  const ttsResult = await textToSpeech(input.text, "Mia", 1.0, "mp3");
  if (!ttsResult.ok) {
    console.error("Failed to synthesize assistant audio:", ttsResult.error);
    return;
  }

  const audioPath = `${input.userId}/${input.conversationId}/${input.messageId}.mp3`;
  const uploadResult = await uploadAudio(
    "ai-audio",
    audioPath,
    ttsResult.audioBuffer,
    "audio/mpeg",
  );
  if (!uploadResult.ok) {
    console.error("Failed to upload assistant audio:", uploadResult.error);
    return;
  }

  await speakingService.updateMessageAudioUrl(input.messageId, audioPath);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

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

  if (audio && audio.size > MAX_AUDIO_FILE_SIZE) {
    return Response.json(
      {
        success: false,
        error: `Audio file exceeds ${MAX_AUDIO_FILE_SIZE}B limit`,
      },
      { status: 413 },
    );
  }

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
      await rollbackUserMessage({
        messageId: userMessageResult.message.id,
        exerciseId,
        userAudioPath,
      });
      return Response.json(
        { success: false, error: "Failed to upload audio" },
        { status: 500 },
      );
    }

    await speakingService.updateMessageAudioUrl(
      userMessageResult.message.id,
      userAudioPath,
    );
  }

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
      id: userMessageResult.message.id,
      conversationId,
      role: "user" as const,
      content: message,
      audioUrl: userAudioPath,
      createdAt: userMessageResult.message.createdAt,
    },
  ];

  const abortController = new AbortController();
  const { signal } = abortController;

  if (request.signal.aborted) {
    await rollbackUserMessage({
      messageId: userMessageResult.message.id,
      exerciseId,
      userAudioPath,
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

      if (signal.aborted) {
        controller.close();
        return;
      }

      const heartbeatTimer = setInterval(() => {
        if (signal.aborted) return;

        try {
          controller.enqueue(heartbeatSSE());
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);

      let fullText = "";
      let sentenceIndex = 0;
      let shouldRollbackUserMessage = true;

      const ttsQueue = new TtsQueue(
        (index, audioBase64, format) => {
          send("audio_chunk", { index, audioBase64, format });
        },
        "mp3",
        10,
      );

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
        { maxWords: 30, firstChunkTimeout: 8000, laterChunkTimeout: 25000 },
      );

      try {
        const aiResult = await generateSpeakingResponseStream(
          history,
          accessInfo.scenarioType,
          accessInfo.aiRole,
          signal,
        );

        if (!aiResult.ok) {
          await rollbackUserMessage({
            messageId: userMessageResult.message.id,
            exerciseId,
            userAudioPath,
          });
          shouldRollbackUserMessage = false;
          send("error", { error: getSpeakingAiFailureMessage(aiResult.error) });
          send("done", { fullText: "" });
          return;
        }

        for await (const chunk of aiResult.stream) {
          if (signal.aborted) break;

          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;

          fullText += delta;
          send("text_delta", { delta });

          if (ttsQueue.isFull()) {
            chunker.pause();
            await ttsQueue.waitForSpace();
            if (signal.aborted) break;
            chunker.resume();
          }

          chunker.pushText(delta);
        }

        chunker.flush();

        if (signal.aborted) {
          ttsQueue.abort();
          if (shouldRollbackUserMessage) {
            await rollbackUserMessage({
              messageId: userMessageResult.message.id,
              exerciseId,
              userAudioPath,
            });
            shouldRollbackUserMessage = false;
          }
          return;
        }

        if (!fullText.trim()) {
          await rollbackUserMessage({
            messageId: userMessageResult.message.id,
            exerciseId,
            userAudioPath,
          });
          shouldRollbackUserMessage = false;
          send("error", {
            error: getSpeakingAiFailureMessage("Empty AI response"),
          });
          send("done", { fullText: "" });
          return;
        }

        try {
          const aiMsgResult = await speakingService.saveAssistantMessage(
            exerciseId,
            conversationId,
            fullText,
          );
          shouldRollbackUserMessage = false;

          send("message_saved", {
            messageId: aiMsgResult.message.id,
            totalTurns: aiMsgResult.totalTurns,
          });
          send("done", { fullText });

          void persistAssistantAudio({
            userId: user.userId,
            conversationId,
            messageId: aiMsgResult.message.id,
            text: fullText,
          }).catch((error) => {
            console.error("Failed to persist assistant audio:", error);
          });
        } catch (error) {
          console.error("Failed to save AI message:", error);
          await rollbackUserMessage({
            messageId: userMessageResult.message.id,
            exerciseId,
            userAudioPath,
          });
          shouldRollbackUserMessage = false;
          send("error", { error: "Failed to save AI message" });
          send("done", { fullText });
          return;
        }

        await ttsQueue.waitForAll();
      } catch (error) {
        if (!signal.aborted) {
          console.error("Streaming error:", error);
          if (shouldRollbackUserMessage) {
            await rollbackUserMessage({
              messageId: userMessageResult.message.id,
              exerciseId,
              userAudioPath,
            });
            shouldRollbackUserMessage = false;
          }

          const msg =
            error instanceof Error ? error.message : "Unknown streaming error";
          send("error", { error: getSpeakingAiFailureMessage(msg) });
          send("done", { fullText });
        }
      } finally {
        clearInterval(heartbeatTimer);
        chunker.destroy();
        ttsQueue.abort();

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
