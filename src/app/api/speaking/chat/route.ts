import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { speakingChatSchema } from "@/schema/speaking.schema";
import { getFirstError } from "@/lib/error";
import { generateSpeakingResponse } from "@/lib/speaking/aiChat";
import { textToSpeech } from "@/lib/speaking/tts";
import * as speakingService from "@/server/services/speaking.service";
import * as conversationService from "@/server/services/conversation.service";
import type { MessageData } from "@/types/message/messageTypes";

/**
 * POST /api/speaking/chat
 * 确认转写文本后，执行 AI 对话 + TTS 合成，返回完整结果
 *
 * Content-Type: application/json
 * Body: { exerciseId, conversationId, message }
 */
export async function POST(request: NextRequest) {
  // 1. 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  // 2. 解析 body + Zod 校验
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = speakingChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  const { exerciseId, conversationId, message } = parsed.data;

  // 3. 轻量校验 exercise 存在且属于当前用户（不加载消息）
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
    return NextResponse.json({ success: false, error: msg }, { status });
  }

  // 4. 获取历史消息（复用 conversation service，自带归属校验）
  let historyMessages;
  try {
    const result = await conversationService.getConversationMessages(
      user.userId,
      { conversationId, limit: 100 },
    );
    historyMessages = result.messages;
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to load conversation";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  // 5. 保存用户消息（service 层自行校验 exercise 存在性和归属）
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
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  // 6. 构建对话历史（conversation service 返回的消息 + 新的用户消息）
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
      id: userMessageResult.message.id,
      conversationId,
      role: "user" as const,
      content: message,
      audioUrl: null,
      createdAt: userMessageResult.message.createdAt,
    },
  ];

  // 7. 调用 AI 获取回复
  const aiResult = await generateSpeakingResponse(
    message,
    history,
    accessInfo.scenarioType,
    accessInfo.aiRole,
  );

  if (!aiResult.ok) {
    console.error("AI response failed:", aiResult.error);
    return NextResponse.json(
      { success: false, error: "AI response failed, please try again" },
      { status: 502 },
    );
  }

  // 8. 保存 AI 回复
  let aiMessageResult;
  try {
    aiMessageResult = await speakingService.saveAssistantMessage(
      exerciseId,
      conversationId,
      aiResult.text,
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to save AI message";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  // 9. 调用 TTS 合成音频
  let audioBase64: string | null = null;
  const ttsResult = await textToSpeech(aiResult.text);

  if (ttsResult.ok) {
    audioBase64 = ttsResult.audioBuffer.toString("base64");
  }
  // TTS 失败时不阻断流程，AI 消息已保存（audioUrl 为 null）

  // 10. 返回完整结果
  return NextResponse.json({
    success: true,
    data: {
      userMessage: {
        id: userMessageResult.message.id,
        content: userMessageResult.message.content,
      },
      aiMessage: {
        id: aiMessageResult.message.id,
        content: aiMessageResult.message.content,
        audioUrl: aiMessageResult.message.audioUrl,
      },
      audioBase64,
      totalTurns: aiMessageResult.totalTurns,
    },
  });
}
