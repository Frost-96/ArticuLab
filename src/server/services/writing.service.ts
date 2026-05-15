// src/server/services/writing.service.ts

import { cache } from "react";
import * as writingRepo from "@/server/repositories/writing.repository";
import { prisma } from "@/lib/prisma";
import { assessWriting } from "@/lib/writing/assessWriting";
import { countWords } from "@/lib/writing/words";
import { getFirstError } from "@/lib/error";
import {    
    type WritingExerciseStatus , 
    type WritingScenarioType , 
    type CreateWritingExerciseInput,
    type GetWritingHistoryInput,
    type GetWritingExerciseInput,
    type DeleteWritingExerciseInput,
    type RenameWritingExerciseInput,
    type GetDraftInput,
    type SaveDraftInput,
    type SubmitWritingInput,
    createWritingExerciseSchema,
    getWritingExerciseSchema,
    deleteWritingExerciseSchema,
    renameWritingExerciseSchema,
    getWritingHistorySchema,
    getDraftSchema,
    saveDraftSchema,
    submitWritingSchema,
    writingReviewResultSchema,
    idSchema

} from "@/schema";
//import { writingErrorResponse } from "@/lib/writing/errors";
import type { WritingResult, WritingExerciseSummary, WritingExerciseDetail, DraftData, WritingHistoryResult, SubmitWritingResult } from "@/types/writing/writingTypes"
import { isGraded, inferExerciseStatus, getFeedback } from "@/lib/writing/exerciseHelpers";

function normalizeUserId(userId: string) {
    const parsedId = idSchema.safeParse(userId);

    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    return parsedId.data;
}

const loadWritingHistory = cache(
    async (
        userId: string,
        scenarioType: WritingScenarioType | undefined,
        status: WritingExerciseStatus | undefined,
        page: number,
        limit: number,
    ): Promise<WritingHistoryResult> => {
        const skip = (page - 1) * limit;

        const { rows, total } = await writingRepo.findWritingExercises({
            userId,
            scenarioType,
            status,
            skip,
            take: limit,
        });

        const exercises: WritingExerciseSummary[] = rows.map((ex) => ({
            id: ex.id,
            scenarioType: ex.scenarioType as WritingScenarioType,
            prompt: ex.prompt,
            wordCount: ex.wordCount,
            overallScore: ex.overallScore,
            status: inferExerciseStatus(ex),
            createdAt: ex.createdAt.toISOString(),
            evaluatedAt: isGraded(ex) ? ex.updatedAt.toISOString() : null,
        }));

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
    },
);

// ==================== 获取写作练习列表 ====================

/**
 * 获取写作练习历史（带分页和统计）
 * @param userId - 用户 ID
 * @param params
    *  params: {
            scenarioType?: WritingScenarioType;
            status?: WritingExerciseStatus;
            page: number;
            limit: number;
        } - 筛选和分页参数
 * @returns 练习列表、分页信息和统计摘要
 * 
 */
export async function getWritingHistory(
    userId: string,
    params: GetWritingHistoryInput
): Promise<WritingHistoryResult> {

// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=getWritingHistorySchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { scenarioType, status, page, pageSize: limit } = parsedParams.data;
    return loadWritingHistory(userID, scenarioType, status, page, limit);
    /*
    const skip = (page - 1) * limit;

    // 获取练习列表
    const { rows, total } = await writingRepo.findWritingExercises({
        userId: userID,
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
            evaluatedAt: isGraded(ex) ? ex.updatedAt.toISOString() : null,
        };
    });

    // 获取统计信息
    const stats = await writingRepo.countCompletedExercises(userID);

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
    */
}

// ==================== 创建写作练习 ====================

/**
 * 创建写作练习
 * @param userId - 用户 ID
 * @param params - 创建参数
 *     params: {
        scenarioType: WritingScenarioType;
        prompt: string;
        isCustomPrompt: boolean;
        scenarioId?: string | null;
       }
 * @returns 创建的练习详情
 */
export async function createWritingExercise(
    userId: string,
    params: CreateWritingExerciseInput
): Promise<{ exercise: WritingExerciseDetail }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=createWritingExerciseSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { scenarioType, prompt, isCustomPrompt, scenarioId } = parsedParams.data;

    // 校验 scenarioId（如果提供）
    let resolvedPrompt = prompt.trim();
    const resolvedScenarioId: string | null =
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
        resolvedPrompt = scenario.prompt;
    }

    // 创建练习
    const created = await writingRepo.createWritingExercise({
        userId: userID,
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
    //id: string
    params: GetWritingExerciseInput
): Promise<{ exercise: WritingExerciseDetail }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=getWritingExerciseSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { exerciseId } = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
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
    params: DeleteWritingExerciseInput
): Promise<{ id: string }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=deleteWritingExerciseSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { exerciseId } = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    await writingRepo.deleteWritingExercise(exerciseId);
    return { id: ex.id };
}

export async function renameWritingExercise(
    userId: string,
    params: RenameWritingExerciseInput,
): Promise<{ exercise: WritingExerciseDetail }> {
    const userID = normalizeUserId(userId);

    const parsedParams = renameWritingExerciseSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { exerciseId, title } = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
    if (!ex) {
        throw new Error("Writing exercise not found");
    }

    const updated = await writingRepo.updateWritingExercise(exerciseId, {
        prompt: title.trim(),
    });

    return {
        exercise: {
            id: updated.id,
            userId: updated.userId,
            scenarioType: updated.scenarioType as WritingScenarioType,
            prompt: updated.prompt,
            isCustomPrompt: updated.isCustomPrompt,
            content: updated.content,
            wordCount: updated.wordCount,
            status: inferExerciseStatus(updated),
            scores: isGraded(updated)
                ? {
                      overall: updated.overallScore,
                      grammar: updated.grammarScore,
                      vocabulary: updated.vocabularyScore,
                      coherence: updated.coherenceScore,
                      taskCompletion: updated.taskScore,
                  }
                : {
                      overall: null,
                      grammar: null,
                      vocabulary: null,
                      coherence: null,
                      taskCompletion: null,
                  },
            feedback: getFeedback(updated),
            scenarioId: updated.scenarioId,
            createdAt: updated.createdAt.toISOString(),
            evaluatedAt: isGraded(updated)
                ? updated.updatedAt.toISOString()
                : null,
        },
    };
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
    params: GetDraftInput
): Promise<{ draft: DraftData }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=getDraftSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { exerciseId } = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
    if (!ex) {
        throw new Error("写作练习记录不存在");
    }

    //const fb = getFeedback(ex);
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
    params: SaveDraftInput
): Promise<{ draft: DraftData }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=saveDraftSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const {exerciseId, content, wordCount} = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
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

    const updated = await writingRepo.updateWritingExercise(exerciseId, {
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
export async function completeWritingExercise(
    userId: string,
    params: GetWritingExerciseInput,
): Promise<{ exercise: WritingExerciseDetail }> {
    const userID = normalizeUserId(userId);

    const parsedParams = getWritingExerciseSchema.safeParse(params);
    if (!parsedParams.success) {
        throw new Error(getFirstError(parsedParams.error));
    }

    const { exerciseId } = parsedParams.data;
    const exercise = await writingRepo.findWritingExerciseById(
        exerciseId,
        userID,
    );

    if (!exercise) {
        throw new Error("鍐欎綔缁冧範璁板綍涓嶅瓨鍦?");
    }

    const updated = await writingRepo.updateWritingExercise(exerciseId, {
        status: "completed",
    });

    return {
        exercise: {
            id: updated.id,
            userId: updated.userId,
            scenarioType: updated.scenarioType as WritingScenarioType,
            prompt: updated.prompt,
            isCustomPrompt: updated.isCustomPrompt,
            content: updated.content,
            wordCount: updated.wordCount,
            status: inferExerciseStatus(updated),
            scores: isGraded(updated)
                ? {
                      overall: updated.overallScore,
                      grammar: updated.grammarScore,
                      vocabulary: updated.vocabularyScore,
                      coherence: updated.coherenceScore,
                      taskCompletion: updated.taskScore,
                  }
                : {
                      overall: null,
                      grammar: null,
                      vocabulary: null,
                      coherence: null,
                      taskCompletion: null,
                  },
            feedback: getFeedback(updated),
            scenarioId: updated.scenarioId,
            createdAt: updated.createdAt.toISOString(),
            evaluatedAt: isGraded(updated)
                ? updated.updatedAt.toISOString()
                : null,
        },
    };
}

export async function submitWriting(
    userId: string,
    params: SubmitWritingInput
): Promise<{ result: SubmitWritingResult }> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=submitWritingSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { exerciseId, scenarioType, isCustomPrompt, prompt, content } = parsedParams.data;

    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
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

    if(scenarioType !== ex.scenarioType){ 
        throw new Error("场景类型非法");
    }
    if(isCustomPrompt !== ex.isCustomPrompt){ 
        throw new Error("iscustomPrompt 非法");
    }

    
    const processingStartTime = Date.now();    
    // 调用 AI 批改
    const result = await assessWriting({
        scenarioType: ex.scenarioType,
        prompt: prompt,
        content: content,
        wordCount: content.trim().split(/\s+/).length,
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
        content: content,
        prompt: prompt,
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
    params: GetWritingExerciseInput
): Promise<WritingResult> {
// ==================== 校验输入 ====================
    const userID = normalizeUserId(userId);

    const parsedParams=getDraftSchema.safeParse(params);
    if(!parsedParams.success){
        throw new Error(getFirstError(parsedParams.error));
    }

// ==================== 业务逻辑 ====================
    const { exerciseId } = parsedParams.data;
    const ex = await writingRepo.findWritingExerciseById(exerciseId, userID);
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
        status: "completed" ,
        feedback: fb.data,
        createdAt: ex.createdAt.toISOString(),
        submittedAt: ex.updatedAt.toISOString(),
        evaluatedAt: ex.updatedAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
    };
}

// ==================== 获取改进建议 ====================

/**
 * 获取批改生成的改进建议与参考范文
 * @param userId - 用户 ID
 * @param id - 练习 ID
 * @returns 改进建议和范文
 */
/* export async function getWritingSuggestions(
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
 */
