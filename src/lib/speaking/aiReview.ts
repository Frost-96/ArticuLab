// src/lib/speaking/aiReview.ts
// 口语练习 AI 评估反馈模块

import type { SpeakingReviewResult } from "@/schema/speaking.schema";
import type { MessageData } from "@/types/message/messageTypes";

/**
 * 生成口语练习的 AI 评估反馈
 * @param conversationHistory - 会话历史消息
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns 结构化的评估结果
 */
export async function generateSpeakingReview(
    conversationHistory: MessageData[],
    scenarioType: string,
    scenarioRole: string
): Promise<SpeakingReviewResult> {
    // TODO: 实现 AI 评估逻辑
    // 后续需要：
    // 1. 构建评估 prompt（基于 scenarioType 和 conversationHistory）
    // 2. 调用 LLM API
    // 3. 解析 JSON 响应并用 speakingReviewResultSchema 校验
    // 4. 返回评估结果
    void conversationHistory;
    void scenarioType;
    void scenarioRole;
    return {
        fluencyScore: 7.5,
        accuracyScore: 8.0,
        overallComment: "Good performance with minor grammar issues.",
        grammarErrors: [],
        vocabularyAnalysis: {
            totalUniqueWords: 50,
            advancedWordsUsed: ["excellent", "demonstrate"],
            suggestedVocabulary: [],
        },
        expressionSuggestions: [],
        strengths: ["Clear pronunciation", "Good fluency"],
        improvements: ["Use more varied vocabulary"],
    };
}
