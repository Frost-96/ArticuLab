// src/server/services/writing.service.ts

import * as writingRepo from "@/server/repositories/writing.repository";
import { prisma } from "@/lib/prisma";
import { assessWriting } from "@/lib/writing/assessWriting";
//import { MIN_WORDS, MAX_WORDS } from "@/lib/writing/constants";
import { countWords } from "@/lib/writing/words";
import { parseFeedback } from "@/lib/writing/feedbackTypes";
import  { type WritingExerciseStatus , type WritingReviewResult , type WritingScenarioType , writingReviewResultSchema} from "@/schema";
//import { writingErrorResponse } from "@/lib/writing/errors";

// ==================== 类型定义 ====================

export type WritingExerciseSummary = {
    id: string;
    scenarioType: WritingScenarioType;
    prompt: string;
    wordCount: number;
    overallScore: number | null;
    status: WritingExerciseStatus;
    createdAt: string;
    evaluatedAt: string | null;
};

export type WritingExerciseDetail = {
    id: string;
    userId: string;
    scenarioType: WritingScenarioType;
    prompt: string;
    isCustomPrompt: boolean;
    content: string;
    wordCount: number;
    status: WritingExerciseStatus;
    scores: {
        overall: number | null;
        grammar: number | null;
        vocabulary: number | null;
        coherence: number | null;
        taskCompletion: number | null;
    } | null;
    /* feedback: {
        summary: string;
        issues: Array<{
            id: number;
            type: "error" | "suggestion" | "enhancement";
            severity: "high" | "medium" | "low";
            sentence: string;
            correction: string;
            explanation: string;
            position: { start: number; end: number };
            category?: string;
        }>;
    } | null; */
    feedback: WritingReviewResult | null;
    scenarioId: string | null;
    createdAt: string;
    evaluatedAt: string | null;
};

export type DraftData = {
    id: string;
    content: string;
    wordCount: number;
    status: WritingExerciseStatus;
    lastSavedAt: string;
};

export type WritingHistoryResult = {
    exercises: WritingExerciseSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        totalExercises: number;
        completedExercises: number;
        averageScore: number | null;
        highestScore: number | null;
        lowestScore: number | null;
    };
};

export type SubmitWritingResult = {
    id: string;
    status: "completed";
    message: string;
    estimatedWaitTime: number;
    submittedAt: string;
    evaluatedAt: string;
    data: WritingReviewResult;
};

// ==================== 辅助函数 ====================

function isGraded(ex: { overallScore: number | null }): boolean {
    return ex.overallScore != null;
}

function inferExerciseStatus(ex: { overallScore: number | null }): WritingExerciseStatus {
    return isGraded(ex) ? "completed" : "draft";
}

function getFeedback(ex: { feedback: unknown }): WritingReviewResult | null {
    return parseFeedback(ex.feedback);
}

// ==================== 获取写作练习列表 ====================

/**
 * 获取写作练习历史（带分页和统计）
 * @param userId - 用户 ID
 * @param params - 筛选和分页参数
 * @returns 练习列表、分页信息和统计摘要
 */
export async function getWritingHistory(
    userId: string,
    params: {
        scenarioType?: WritingScenarioType;
        status?: WritingExerciseStatus;
        page: number;
        limit: number;
    }
): Promise<WritingHistoryResult> {
    const { scenarioType, status, page, limit } = params;
    const skip = (page - 1) * limit;

    // 获取练习列表
    const { rows, total } = await writingRepo.findWritingExercises({
        userId,
        scenarioType,
        status,
        skip,
        take: limit,
    });

    // 格式化列表
    const exercises: WritingExerciseSummary[] = rows.map((ex) => {
        //const fb = getFeedback(ex);
        return {
            id: ex.id,
            scenarioType: ex.scenarioType as WritingScenarioType,
            prompt: ex.prompt,
            wordCount: ex.wordCount,
            overallScore: ex.overallScore,
            status: inferExerciseStatus(ex),
            createdAt: ex.createdAt.toISOString(),
            evaluatedAt: isGraded(ex) ? (ex.updatedAt as Date).toISOString() : null,
        };
    });

    // 获取统计信息
    const stats = await writingRepo.countCompletedExercises(userId);

    const summary =
        stats.count > 0
            ? {
                  totalExercises: total,
                  completedExercises: stats.count,
                  averageScore:
                      stats.average != null
                          ? Math.round(stats.average * 10) / 10
                          : null,
                  highestScore: stats.max ?? null,
                  lowestScore: stats.min ?? null,
              }
            : {
                  totalExercises: total,
                  completedExercises: 0,
                  averageScore: null,
                  highestScore: null,
                  lowestScore: null,
              };

    return {
        exercises,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary,
    };
}

// ==================== 创建写作练习 ====================

/**
 * 创建写作练习
 * @param userId - 用户 ID
 * @param params - 创建参数
 * @returns 创建的练习详情
 */
export async function createWritingExercise(
    userId: string,
    params: {
        scenarioType: WritingScenarioType;
        prompt: string;
        isCustomPrompt: boolean;
        scenarioId?: string | null;
    }
): Promise<{ exercise: WritingExerciseDetail }> {
    const { scenarioType, prompt, isCustomPrompt, scenarioId } = params;

    // 校验 scenarioId（如果提供）
    let resolvedPrompt = prompt.trim();
    let resolvedScenarioId: string | null =
        typeof scenarioId === "string" && scenarioId ? scenarioId : null;

    if (resolvedScenarioId) {
        const scenario = await prisma.scenario.findUnique({
            where: { id: resolvedScenarioId },
        });
        if (!scenario || scenario.type !== "writing") {
            throw new Error("场景不存在或不是写作场景");
        }
        if (scenario.category !== scenarioType) {
            throw new Error(
                `场景类型不匹配：请求类型 ${scenarioType}，实际场景类型 ${scenario.category}`
            );
        }
        resolvedPrompt = scenario.title;
    }

    // 创建练习
    const created = await writingRepo.createWritingExercise({
        userId,
        scenarioType,
        prompt: resolvedPrompt,
        isCustomPrompt,
        scenarioId: resolvedScenarioId,
    });

    return {
        exercise: {
            id: created.id,
            userId: created.userId,
            scenarioType: created.scenarioType as WritingScenarioType,
            prompt: created.prompt,
            isCustomPrompt: created.isCustomPrompt,
            content: created.content,
            wordCount: created.wordCount,
            status: "draft" as WritingExerciseStatus,
            scores: {
                overall: null,
                grammar: null,
                vocabulary: null,
                coherence: null,
                taskCompletion: null,
            },
            feedback: null,
            scenarioId: created.scenarioId,
            createdAt: created.createdAt.toISOString(),
            evaluatedAt: null,
        },
    };
}

// ==================== 获取写作练习详情 ====================

/**
 * 获取写作练习详情
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 练习详情
 */
export async function getWritingExercise(
    userId: string,
    id: string
): Promise<{ exercise: WritingExerciseDetail }> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    const fb = getFeedback(ex);
    const status = inferExerciseStatus(ex);

    return {
        exercise: {
            id: ex.id,
            userId: ex.userId,
            scenarioType: ex.scenarioType as WritingScenarioType,
            prompt: ex.prompt,
            isCustomPrompt: ex.isCustomPrompt,
            content: ex.content,
            wordCount: ex.wordCount,
            status,
            scores: isGraded(ex)
                ? {
                      overall: ex.overallScore,
                      grammar: ex.grammarScore,
                      vocabulary: ex.vocabularyScore,
                      coherence: ex.coherenceScore,
                      taskCompletion: ex.taskScore,
                  }
                : {
                      overall: null,
                      grammar: null,
                      vocabulary: null,
                      coherence: null,
                      taskCompletion: null,
                  },
            feedback: fb ?? null,
            scenarioId: ex.scenarioId,
            createdAt: ex.createdAt.toISOString(),
            evaluatedAt: isGraded(ex) ? (ex.updatedAt as Date).toISOString() : null,
        },
    };
}

// ==================== 删除写作练习 ====================

/**
 * 删除写作练习
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 已删除的练习 ID
 */
export async function deleteWritingExercise(
    userId: string,
    id: string
): Promise<{ id: string }> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    await writingRepo.deleteWritingExercise(id);
    return { id: ex.id };
}

// ==================== 获取草稿 ====================

/**
 * 获取写作草稿
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 草稿数据
 */
export async function getDraft(
    userId: string,
    id: string
): Promise<{ draft: DraftData }> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    const fb = getFeedback(ex);
    const lastSavedAt = (ex.updatedAt as Date).toISOString();

    return {
        draft: {
            id: ex.id,
            content: ex.content,
            wordCount: ex.wordCount,
            status: inferExerciseStatus(ex),
            lastSavedAt,
        },
    };
}

// ==================== 保存草稿 ====================

/**
 * 保存写作草稿
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @param content - 作文内容
 * @param wordCount - 字数
 * @returns 保存后的草稿数据
 */
export async function saveDraft(
    userId: string,
    id: string,
    content: string,
    wordCount: number
): Promise<{ draft: DraftData }> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    if (isGraded(ex)) {
        throw new Error("练习已批改完成，无法修改草稿");
    }

    // 校验字数
    const actualWords = countWords(content);
    const threshold =
        wordCount <= 10
            ? 2
            : wordCount <= 50
              ? 3
              : Math.max(5, Math.floor(wordCount * 0.1));

    if (Math.abs(actualWords - wordCount) > threshold) {
        throw new Error("字数统计与内容不一致");
    }

    // 更新 feedback 中的 lastSavedAt
   /*  const prev = parseFeedback(ex.feedback);
    const nextFb: StoredWritingFeedback = {
        ...prev,
        _meta: {
            ...(prev._meta || {}),
            lastSavedAt: new Date().toISOString(),
        },
    }; */

    const updated = await writingRepo.updateWritingExercise(id, {
        content,
        wordCount: Math.floor(wordCount),
        //feedback: nextFb as object,
    });

    return {
        draft: {
            id: updated.id,
            content: updated.content,
            wordCount: updated.wordCount,
            status: inferExerciseStatus(updated),
            lastSavedAt: (updated.updatedAt as Date).toISOString(),
        },
    };
}

// ==================== 提交写作批改 ====================

/**
 * 提交写作进行 AI 批改
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 提交结果
 */
export async function submitWriting(
    userId: string,
    params: {
        exerciseId: string;
        scenarioType: WritingScenarioType;
        prompt: string;
        isCustomPrompt: boolean;
        content: string;
    }
): Promise<{ result: SubmitWritingResult }> {
    const ex = await writingRepo.findWritingExerciseById(params.exerciseId, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    if (isGraded(ex)) {
        throw new Error("练习已批改，无法重复提交");
    }

   /*  if (ex.wordCount < MIN_WORDS) {
        throw new Error(`作文过短，至少需要 ${MIN_WORDS} 词`);
    }

    if (ex.wordCount > MAX_WORDS) {
        throw new Error(`作文过长，最多 ${MAX_WORDS} 词`);
    } */

    const submittedAt = new Date().toISOString();

    // 获取 scenario 详细信息（如果存在）
    const scenario = ex.scenarioId
        ? await prisma.scenario.findUnique({
              where: { id: ex.scenarioId },
          })
        : null;

    if(params.scenarioType !== ex.scenarioType){ 
        throw new Error("场景类型非法");
    }
    if(params.isCustomPrompt !== ex.isCustomPrompt){ 
        throw new Error("iscustomPrompt 非法");
    }

    
    const processingStartTime = Date.now();    
    // 调用 AI 批改
    const result = await assessWriting({
        scenarioType: ex.scenarioType,
        prompt: params.prompt,
        content: params.content,
        wordCount: params.content.trim().split(/\s+/).length,
        description: scenario?.description,
    });

    if (!result.ok) {
        throw new Error(`AI 批改服务失败：${result.error}`);
    }

    const parsed = writingReviewResultSchema.safeParse(result.data);

    if (!parsed.success) {
        throw new Error(`AI 批改服务返回数据格式错误：${parsed.error}`);
    }

    const processingEndTime = Date.now();
    const actualWaitTimeMs = processingEndTime - processingStartTime;

    // 更新练习记录
    const evaluatedAt = new Date().toISOString();

    const updated = await writingRepo.updateWritingExercise(params.exerciseId, {
        content: params.content,
        prompt: params.prompt,
        overallScore: parsed.data.overallScore,
        grammarScore: parsed.data.grammarScore,
        vocabularyScore: parsed.data.vocabularyScore,
        coherenceScore: parsed.data.coherenceScore,
        taskScore: parsed.data.taskScore,
        feedback: parsed.data as object,
    });

    return {
        result: {
            id: updated.id,
            status: "completed",
            message: "批改已完成",
            estimatedWaitTime: actualWaitTimeMs,
            submittedAt,
            evaluatedAt,
            data: parsed.data,
        },
    };
}

// ==================== 获取批改结果 ====================

/**
 * 获取 AI 批改结果
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 批改结果
 */
export async function getWritingResult(
    userId: string,
    id: string
): Promise<{
    id: string;
    status: WritingExerciseStatus;
    scores: {
        overall: number;
        grammar: number;
        vocabulary: number;
        coherence: number;
        taskCompletion: number;
    };
    feedback: WritingReviewResult;
    createdAt: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
    updatedAt: string;
}> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    if (!isGraded(ex)) {
        throw new Error("尚未完成批改，暂无结果");
    }

    if (!ex.feedback) {
        throw new Error("批改结果不存在");
    }

    const fb = writingReviewResultSchema.safeParse(ex.feedback);
    if (!fb.success) {
        throw new Error("批改结果数据格式错误");
    }
    return {
        id: ex.id,
        status: "completed" as WritingExerciseStatus,
        scores: {
            overall: fb.data.overallScore,
            grammar: fb.data.grammarScore,
            vocabulary: fb.data.vocabularyScore,
            coherence: fb.data.coherenceScore,
            taskCompletion: fb.data.taskScore,
        },
        feedback: fb.data,
        createdAt: ex.createdAt.toISOString(),
        submittedAt: (ex.updatedAt as Date).toISOString(),
        evaluatedAt: (ex.updatedAt as Date).toISOString(),
        updatedAt: (ex.updatedAt as Date).toISOString(),
    };
}

// ==================== 获取改进建议 ====================

/**
 * 获取批改生成的改进建议与参考范文
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 改进建议和范文
 */
export async function getWritingSuggestions(
    userId: string,
    id: string
): Promise<{
    id: string;
    suggestions: Array<{
        category: string;
        title: string;
        description: string;
        items: Array<Record<string, unknown>>;
    }>;
    modelEssay: {
        title: string;
        content: string;
        analysis: string;
    };
}> {
    const ex = await writingRepo.findWritingExerciseById(id, userId);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    if (!isGraded(ex)) {
        throw new Error("尚未完成批改，暂无改进建议");
    }

    const fb = getFeedback(ex);
    if (!fb) {
        throw new Error("批改结果不存在");
    }

    return {
        id: ex.id,
        suggestions: fb.sampleExpressions?.map((expr, idx) => ({
            category: "expression",
            title: `表达改进 ${idx + 1}`,
            description: expr.explanation,
            items: [{ original: expr.original, improved: expr.improved }],
        })) ?? [],
        modelEssay: {
            title: "",
            content: "",
            analysis: fb.overallComment,
        },
    };
}
