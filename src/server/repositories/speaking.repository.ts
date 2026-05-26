import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { SpeakingExerciseStatus, SpeakingScenarioType } from "@/schema";

const speakingMessageSelect = {
  id: true,
  role: true,
  content: true,
  audioUrl: true,
  pronunciationScore: true,
  pronunciationAccuracy: true,
  pronunciationFluency: true,
  pronunciationCompleteness: true,
  pronunciationProsody: true,
  pronunciationFeedback: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

/** 轻量级练习存在性校验的 select（不加载消息） */
const speakingExerciseVerifySelect = {
  id: true,
  conversationId: true,
  scenarioType: true,
  scenarioRole: true,
  status: true,
  createdAt: true,
  scenario: {
    select: {
      title: true,
      description: true,
      prompt: true,
      aiRole: true,
    },
  },
  conversation: {
    select: {
      title: true,
    },
  },
} satisfies Prisma.SpeakingExerciseSelect;

const speakingExerciseListSelect = {
  id: true,
  conversationId: true,
  scenarioType: true,
  scenarioRole: true,
  status: true,
  totalTurns: true,
  durationSeconds: true,
  fluencyScore: true,
  accuracyScore: true,
  createdAt: true,
  updatedAt: true,
  scenario: {
    select: {
      title: true,
    },
  },
  conversation: {
    select: {
      title: true,
    },
  },
} satisfies Prisma.SpeakingExerciseSelect;

const speakingExerciseDetailSelect = {
  id: true,
  scenarioId: true,
  scenarioType: true,
  scenarioRole: true,
  conversationId: true,
  status: true,
  totalTurns: true,
  durationSeconds: true,
  fluencyScore: true,
  accuracyScore: true,
  feedback: true,
  createdAt: true,
  updatedAt: true,
  scenario: {
    select: {
      title: true,
      description: true,
      prompt: true,
      aiRole: true,
    },
  },
  conversation: {
    select: {
      title: true,
      messages: {
        where: {
          isDeleted: false,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: speakingMessageSelect,
      },
    },
  },
} satisfies Prisma.SpeakingExerciseSelect;

export async function findSpeakingExercises(params: {
  userId: string;
  scenarioType?: SpeakingScenarioType;
  skip?: number;
  take?: number;
}) {
  const { userId, scenarioType, skip = 0, take = 20 } = params;

  const where: Prisma.SpeakingExerciseWhereInput = {
    userId,
    isDeleted: false,
    ...(scenarioType ? { scenarioType } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.speakingExercise.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      select: speakingExerciseListSelect,
    }),
    prisma.speakingExercise.count({ where }),
  ]);

  return { rows, total };
}

export async function findSpeakingExerciseById(id: string, userId: string) {
  return prisma.speakingExercise.findFirst({
    where: {
      id,
      userId,
      isDeleted: false,
      conversation: {
        isDeleted: false,
      },
    },
    select: speakingExerciseDetailSelect,
  });
}

/**
 * 校验练习存在且属于用户，返回基础字段（不加载消息）
 *
 * @param id - 练习 ID
 * @param userId - 用户 ID
 * @returns 练习基础信息，不存在时返回 null
 */
export async function verifyExerciseExists(id: string, userId: string) {
  return prisma.speakingExercise.findFirst({
    where: {
      id,
      userId,
      isDeleted: false,
      conversation: {
        isDeleted: false,
      },
    },
    select: speakingExerciseVerifySelect,
  });
}

export async function createSpeakingExercise(data: {
  userId: string;
  scenarioId?: string | null;
  scenarioType: SpeakingScenarioType;
  scenarioRole: string;
  conversationTitle: string;
}) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        userId: data.userId,
        type: "speaking",
        title: data.conversationTitle,
        scenarioId: data.scenarioId,
      },
      select: {
        id: true,
      },
    });

    const exercise = await tx.speakingExercise.create({
      data: {
        userId: data.userId,
        scenarioId: data.scenarioId,
        scenarioType: data.scenarioType,
        scenarioRole: data.scenarioRole,
        conversationId: conversation.id,
        status: "in_progress",
        totalTurns: 0,
        durationSeconds: 0,
      },
      select: {
        id: true,
      },
    });

    return tx.speakingExercise.findUniqueOrThrow({
      where: {
        id: exercise.id,
      },
      select: speakingExerciseDetailSelect,
    });
  });
}

export async function saveSpeakingMessage(data: {
  exerciseId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        audioUrl: data.audioUrl ?? null,
      },
      select: speakingMessageSelect,
    });

    const updated = await tx.speakingExercise.update({
      where: {
        id: data.exerciseId,
      },
      data: {
        totalTurns: { increment: 1 },
      },
      select: { totalTurns: true },
    });

    return { message, totalTurns: updated.totalTurns ?? 1 };
  });
}

/**
 * 回滚已保存的消息（软删除 + totalTurns 减 1）
 *
 * 用于客户端断开时清理已保存的用户消息，
 * 避免因 AI 无法回复而产生孤儿 message 记录。
 */
export async function deleteSpeakingMessage(data: {
  messageId: string;
  exerciseId: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: data.messageId },
      data: { isDeleted: true },
    });

    const updated = await tx.speakingExercise.update({
      where: { id: data.exerciseId },
      data: { totalTurns: { decrement: 1 } },
      select: { totalTurns: true },
    });

    return { totalTurns: updated.totalTurns ?? 0 };
  });
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
) {
  return prisma.message.update({
    where: { id: messageId },
    data: { audioUrl },
  });
}

export async function completeSpeakingExercise(data: {
  exerciseId: string;
  status: SpeakingExerciseStatus;
  totalTurns: number;
  durationSeconds: number;
}) {
  return prisma.speakingExercise.update({
    where: {
      id: data.exerciseId,
    },
    data: {
      status: data.status,
      totalTurns: data.totalTurns,
      durationSeconds: data.durationSeconds,
    },
    select: speakingExerciseDetailSelect,
  });
}

export async function updateSpeakingExercise(
  exerciseId: string,
  data: Pick<
    Prisma.SpeakingExerciseUncheckedUpdateInput,
    | "status"
    | "totalTurns"
    | "durationSeconds"
    | "fluencyScore"
    | "accuracyScore"
    | "feedback"
  >,
) {
  return prisma.speakingExercise.update({
    where: {
      id: exerciseId,
    },
    data,
    select: speakingExerciseDetailSelect,
  });
}

export async function deleteSpeakingExercise(data: {
  exerciseId: string;
  conversationId: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.message.updateMany({
      where: {
        conversationId: data.conversationId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });

    await tx.conversation.update({
      where: {
        id: data.conversationId,
      },
      data: {
        isDeleted: true,
      },
      select: {
        id: true,
      },
    });

    return tx.speakingExercise.update({
      where: {
        id: data.exerciseId,
      },
      data: {
        isDeleted: true,
      },
      select: {
        id: true,
      },
    });
  });
}
