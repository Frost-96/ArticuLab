import { cache } from "react";
import { getFirstError } from "@/lib/error";
import {
  endSpeakingSchema,
  deleteSpeakingExerciseSchema,
  getSpeakingExerciseSchema,
  getSpeakingHistorySchema,
  speakingChatSchema,
  speakingReviewResultSchema,
  startSpeakingSchema,
  pronunciationResultSchema,
  updateSpeakingExerciseSchema,
  type DeleteSpeakingExerciseInput,
  type EndSpeakingInput,
  type GetSpeakingExerciseInput,
  type GetSpeakingHistoryInput,
  type SpeakingExerciseStatus,
  type SpeakingChatInput,
  type StartSpeakingInput,
  type SpeakingReviewResult,
  type SpeakingScenarioType,
  type UpdateSpeakingExerciseInput,
  type PronunciationResultLite,
  idSchema,
} from "@/schema";
import { prisma } from "@/lib/prisma";
import * as speakingRepo from "@/server/repositories/speaking.repository";
import * as messageService from "@/server/services/message.service";
import { Prisma } from "../../../generated/prisma/client";
import type {
  ExerciseAccessInfo,
  SaveSpeakingMessageResult,
  SpeakingExerciseDetail,
  SpeakingHistoryItem,
  SpeakingHistoryResult,
  StartSpeakingResult,
} from "@/types/speaking/speakingTypes";

function parseSpeakingFeedback(raw: unknown): SpeakingReviewResult | null {
  const parsed = speakingReviewResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function mapSpeakingDetail(
  record: Awaited<ReturnType<typeof speakingRepo.findSpeakingExerciseById>>,
): SpeakingExerciseDetail {
  if (!record) {
    throw new Error("Speaking exercise not found");
  }

  return {
    id: record.id,
    conversationId: record.conversationId,
    scenarioId: record.scenarioId,
    title:
      record.conversation.title?.trim() ||
      record.scenario?.title ||
      record.scenarioRole,
    prompt: record.scenario?.prompt ?? "",
    description: record.scenario?.description ?? "",
    aiRole: record.scenario?.aiRole?.trim() || record.scenarioRole,
    scenarioType: record.scenarioType as SpeakingScenarioType,
    status: record.status as SpeakingExerciseStatus,
    totalTurns: record.totalTurns ?? record.conversation.messages.length,
    durationSeconds: record.durationSeconds ?? 0,
    fluencyScore: record.fluencyScore,
    accuracyScore: record.accuracyScore,
    feedback: parseSpeakingFeedback(record.feedback),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    messages: record.conversation.messages.map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      audioUrl: message.audioUrl,
      pronunciationScore: message.pronunciationScore,
      pronunciationAccuracy: message.pronunciationAccuracy,
      pronunciationFluency: message.pronunciationFluency,
      pronunciationCompleteness: message.pronunciationCompleteness,
      pronunciationProsody: message.pronunciationProsody,
      pronunciationFeedback:
        (message.pronunciationFeedback as PronunciationResultLite) ?? null,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

function mapSpeakingHistoryItem(
  record: Awaited<
    ReturnType<typeof speakingRepo.findSpeakingExercises>
  >["rows"][number],
): SpeakingHistoryItem {
  return {
    id: record.id,
    conversationId: record.conversationId,
    title:
      record.conversation?.title?.trim() ||
      record.scenario?.title ||
      record.scenarioRole,
    scenarioType: record.scenarioType as SpeakingScenarioType,
    scenarioRole: record.scenarioRole,
    status: record.status as SpeakingExerciseStatus,
    totalTurns: record.totalTurns ?? 0,
    durationSeconds: record.durationSeconds ?? 0,
    fluencyScore: record.fluencyScore,
    accuracyScore: record.accuracyScore,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const loadSpeakingHistory = cache(
  async (
    userId: string,
    scenarioType: SpeakingScenarioType | undefined,
    page: number,
    pageSize: number,
  ): Promise<SpeakingHistoryResult> => {
    const skip = (page - 1) * pageSize;
    const { rows, total } = await speakingRepo.findSpeakingExercises({
      userId,
      scenarioType,
      skip,
      take: pageSize,
    });

    return {
      exercises: rows.map(mapSpeakingHistoryItem),
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },
);

export async function getSpeakingHistory(
  userId: string,
  params: GetSpeakingHistoryInput,
): Promise<SpeakingHistoryResult> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedParams = getSpeakingHistorySchema.safeParse(params);
  if (!parsedParams.success) {
    throw new Error(getFirstError(parsedParams.error));
  }

  const { page, pageSize, scenarioType } = parsedParams.data;
  return loadSpeakingHistory(parsedId.data, scenarioType, page, pageSize);
}

export async function startSpeakingExercise(
  userId: string,
  input: StartSpeakingInput,
): Promise<StartSpeakingResult> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = startSpeakingSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  let scenarioId: string | null = null;
  let scenarioType: SpeakingScenarioType;
  let scenarioRole: string;
  let conversationTitle: string;

  if (parsedInput.data.scenarioId) {
    // 模式1：基于已有场景
    const scenario = await prisma.scenario.findFirst({
      where: {
        id: parsedInput.data.scenarioId,
        type: "speaking",
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        prompt: true,
        aiRole: true,
        category: true,
      },
    });

    if (!scenario) {
      throw new Error("Speaking scenario not found");
    }

    scenarioId = scenario.id;
    scenarioType = scenario.category as SpeakingScenarioType;
    scenarioRole = scenario.aiRole?.trim() || scenario.title;
    conversationTitle = scenario.title;
  } else {
    // 模式2：自定义参数
    scenarioType = parsedInput.data.scenarioCategory!;
    scenarioRole = parsedInput.data.aiRole!;
    conversationTitle = parsedInput.data.title!;
  }

  const exercise = await speakingRepo.createSpeakingExercise({
    userId: parsedId.data,
    scenarioId,
    scenarioType,
    scenarioRole,
    conversationTitle,
  });

  return {
    exercise: mapSpeakingDetail(exercise),
  };
}

export async function getSpeakingExercise(
  userId: string,
  input: GetSpeakingExerciseInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = getSpeakingExerciseSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  const exercise = await speakingRepo.findSpeakingExerciseById(
    parsedInput.data.id,
    parsedId.data,
  );

  return {
    exercise: mapSpeakingDetail(exercise),
  };
}

export async function saveUserMessage(
  userId: string,
  input: SpeakingChatInput,
): Promise<SaveSpeakingMessageResult> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = speakingChatSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  // 轻量校验（不加载消息），保证 service 层鲁棒性
  const exercise = await speakingRepo.verifyExerciseExists(
    parsedInput.data.exerciseId,
    parsedId.data,
  );

  if (!exercise) {
    throw new Error("Speaking exercise not found");
  }

  if (exercise.conversationId !== parsedInput.data.conversationId) {
    throw new Error("Conversation does not match the exercise");
  }

  const { message, totalTurns } = await speakingRepo.saveSpeakingMessage({
    exerciseId: exercise.id,
    conversationId: exercise.conversationId,
    role: "user",
    content: parsedInput.data.message.trim(),
  });

  return {
    message: {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      audioUrl: message.audioUrl,
      createdAt: message.createdAt.toISOString(),
    },
    totalTurns,
  };
}

/**
 * 删除用户消息（软删除 + totalTurns 减 1）
 *
 * 用于客户端断开时回滚已保存的用户消息，保持对话数据一致性。
 * 仅在消息尚未被 AI 回复时调用（即消息创建后、AI 生成前或生成中断时）。
 *
 * @param messageId - 要删除的消息 ID
 * @param exerciseId - 所属口语练习 ID
 */
export async function deleteUserMessage(
  messageId: string,
  exerciseId: string,
): Promise<void> {
  await speakingRepo.deleteSpeakingMessage({ messageId, exerciseId });
}

export async function endSpeakingExercise(
  userId: string,
  input: EndSpeakingInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = endSpeakingSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  const exercise = await speakingRepo.findSpeakingExerciseById(
    parsedInput.data.exerciseId,
    parsedId.data,
  );

  if (!exercise) {
    throw new Error("Speaking exercise not found");
  }
  const totalTurns = exercise.conversation.messages.length;
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.now() - exercise.createdAt.getTime()) / 1000),
  );

  const updated = await speakingRepo.completeSpeakingExercise({
    exerciseId: exercise.id,
    status: exercise.feedback ? "reviewed" : "completed",
    totalTurns,
    durationSeconds,
  });

  return {
    exercise: mapSpeakingDetail(updated),
  };
}

export async function updateSpeakingExercise(
  userId: string,
  input: UpdateSpeakingExerciseInput,
): Promise<{ exercise: SpeakingExerciseDetail }> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = updateSpeakingExerciseSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  const exercise = await speakingRepo.findSpeakingExerciseById(
    parsedInput.data.id,
    parsedId.data,
  );
  if (!exercise) {
    throw new Error("Speaking exercise not found");
  }

  const updateData: Pick<
    Prisma.SpeakingExerciseUncheckedUpdateInput,
    | "status"
    | "totalTurns"
    | "durationSeconds"
    | "fluencyScore"
    | "accuracyScore"
    | "feedback"
  > = {};

  if (parsedInput.data.status !== undefined) {
    updateData.status = parsedInput.data.status;
  }
  if (parsedInput.data.totalTurns !== undefined) {
    updateData.totalTurns = parsedInput.data.totalTurns;
  }
  if (parsedInput.data.durationSeconds !== undefined) {
    updateData.durationSeconds = parsedInput.data.durationSeconds;
  }
  if (parsedInput.data.fluencyScore !== undefined) {
    updateData.fluencyScore = parsedInput.data.fluencyScore;
  }
  if (parsedInput.data.accuracyScore !== undefined) {
    updateData.accuracyScore = parsedInput.data.accuracyScore;
  }
  if (parsedInput.data.feedback !== undefined) {
    if (parsedInput.data.feedback === null) {
      updateData.feedback = Prisma.JsonNull;
    } else {
      const parsedFeedback = speakingReviewResultSchema.safeParse(
        parsedInput.data.feedback,
      );
      if (!parsedFeedback.success) {
        throw new Error(getFirstError(parsedFeedback.error));
      }
      updateData.feedback = parsedFeedback.data;
      updateData.fluencyScore =
        parsedInput.data.fluencyScore ?? parsedFeedback.data.fluencyScore;
      updateData.accuracyScore =
        parsedInput.data.accuracyScore ?? parsedFeedback.data.accuracyScore;
      updateData.status = parsedInput.data.status ?? "reviewed";
    }
  }

  const updated = await speakingRepo.updateSpeakingExercise(
    exercise.id,
    updateData,
  );

  return {
    exercise: mapSpeakingDetail(updated),
  };
}

export async function deleteSpeakingExercise(
  userId: string,
  input: DeleteSpeakingExerciseInput,
): Promise<{ id: string }> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsedInput = deleteSpeakingExerciseSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getFirstError(parsedInput.error));
  }

  const exercise = await speakingRepo.findSpeakingExerciseById(
    parsedInput.data.id,
    parsedId.data,
  );
  if (!exercise) {
    throw new Error("Speaking exercise not found");
  }

  return speakingRepo.deleteSpeakingExercise({
    exerciseId: exercise.id,
    conversationId: exercise.conversationId,
  });
}

/**
 * 验证口语练习是否存在且属于当前用户，并校验 conversationId 匹配
 * 轻量校验，不加载消息历史
 *
 * @param userId - 用户 ID
 * @param exerciseId - 口语练习 ID
 * @param conversationId - 会话 ID
 * @returns ExerciseAccessInfo（基础练习信息，不含消息）
 * @throws 不存在或无权限时抛出异常
 */
export async function verifyExerciseAccess(
  userId: string,
  exerciseId: string,
  conversationId: string,
): Promise<ExerciseAccessInfo> {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const exercise = await speakingRepo.verifyExerciseExists(
    exerciseId,
    parsedId.data,
  );

  if (!exercise) {
    throw new Error("Speaking exercise not found");
  }

  if (exercise.conversationId !== conversationId) {
    throw new Error("Conversation does not match the exercise");
  }

  return {
    id: exercise.id,
    conversationId: exercise.conversationId,
    scenarioType: exercise.scenarioType as SpeakingScenarioType,
    scenarioRole: exercise.scenarioRole,
    status: exercise.status as SpeakingExerciseStatus,
    title:
      exercise.conversation?.title?.trim() ||
      exercise.scenario?.title ||
      exercise.scenarioRole,
    prompt: exercise.scenario?.prompt ?? "",
    description: exercise.scenario?.description ?? "",
    aiRole: exercise.scenario?.aiRole?.trim() || exercise.scenarioRole,
    createdAt: exercise.createdAt.toISOString(),
  };
}

/**
 * 保存 AI 助手消息
 *
 * @param exerciseId - 口语练习 ID
 * @param conversationId - 会话 ID
 * @param content - 消息内容
 * @param audioUrl - TTS 音频 URL（可选，现阶段可能为 null）
 * @returns 保存的消息和更新后的总轮数
 */
export async function saveAssistantMessage(
  exerciseId: string,
  conversationId: string,
  content: string,
  audioUrl?: string | null,
): Promise<SaveSpeakingMessageResult> {
  const { message, totalTurns } = await speakingRepo.saveSpeakingMessage({
    exerciseId,
    conversationId,
    role: "assistant",
    content,
    audioUrl,
  });

  return {
    message: {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      audioUrl: message.audioUrl,
      createdAt: message.createdAt.toISOString(),
    },
    totalTurns,
  };
}

/**
 * 更新消息的 audioUrl 字段
 *
 * @param messageId - 消息 ID
 * @param audioUrl - 音频存储路径（非完整 URL）
 */
export async function updateMessageAudioUrl(
  messageId: string,
  audioUrl: string,
): Promise<void> {
  await speakingRepo.updateMessageAudioUrl(messageId, audioUrl);
}

// ==================== 发音评估 ====================

/**
 * 保存发音评估结果到对应的 user 消息
 * @param messageId - 消息 ID
 * @param result - Azure 发音评估结果（经 Zod 校验）
 */
export async function savePronunciationResult(
  messageId: string,
  result: unknown,
): Promise<void> {
  const parsedId = idSchema.safeParse(messageId);
  if (!parsedId.success) {
    throw new Error(getFirstError(parsedId.error));
  }

  const parsed = pronunciationResultSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error(getFirstError(parsed.error));
  }

  await messageService.saveMessagePronunciation(parsedId.data, parsed.data);
}
