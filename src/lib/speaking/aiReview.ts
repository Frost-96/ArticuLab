// src/lib/speaking/aiReview.ts
// 口语练习 AI 评估反馈模块

import type { SpeakingReviewResult } from "@/schema/speaking.schema";
import { speakingReviewResultSchema } from "@/schema/speaking.schema";
import type { MessageData } from "@/types/message/messageTypes";
import { getSpeakingLlmClient, getSpeakingLlmModel } from "./speakingLlmClient";

/** AI 评估结果 */
export type ReviewResult =
  | { ok: true; data: SpeakingReviewResult }
  | { ok: false; error: string };

/**
 * 构建口语评估的 system prompt
 *
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns system prompt 文本
 */
function buildReviewPrompt(scenarioType: string, scenarioRole: string): string {
  return `You are an English speaking examiner. Analyze the following conversation and provide a detailed review.

Scenario type: ${scenarioType}
AI role: ${scenarioRole}

Each user message may include Azure Pronunciation Assessment scores (0-100 scale):
- pronunciationScore: overall pronunciation quality
- accuracyScore: phoneme-level accuracy
- fluencyScore: speech fluency (pace, pauses)
- completenessScore: completeness (missing/extra words)
- prosodyScore: prosody (intonation, stress, rhythm)

Use these audio scores alongside your text analysis to produce a comprehensive evaluation.

Return a JSON object with the following structure:
{
  "fluencyScore": <0-10, combining Azure audio fluency with text flow>,
  "accuracyScore": <0-10, combining Azure pronunciation accuracy with grammar precision>,
  "overallComment": "<brief overall assessment incorporating both audio and text analysis>",
  "grammarErrors": [{"original": "<user's text>", "corrected": "<corrected text>", "explanation": "<why>"}],
  "vocabularyAnalysis": {
    "totalUniqueWords": <number>,
    "advancedWordsUsed": ["<word1>", "<word2>"],
    "suggestedVocabulary": [{"word": "<word>", "definition": "<def>", "exampleSentence": "<example>"}]
  },
  "expressionSuggestions": [{"original": "<user's expression>", "improved": "<better expression>", "explanation": "<why better>"}],
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}

Return ONLY the JSON object, no markdown formatting.`;
}

/**
 * 生成口语练习的 AI 评估反馈
 *
 * @param conversationHistory - 会话历史消息
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @returns 结构化的评估结果
 */
export async function generateSpeakingReview(
  conversationHistory: MessageData[],
  scenarioType: string,
  scenarioRole: string,
): Promise<ReviewResult> {
  const client = getSpeakingLlmClient();
  if (!client) {
    return { ok: false, error: "Speaking LLM client not configured" };
  }

  try {
    const model = getSpeakingLlmModel();
    const systemPrompt = buildReviewPrompt(scenarioType, scenarioRole);

    // 构建对话文本用于评估（用户消息附带 Azure 发音分数）
    const conversationText = conversationHistory
      .map((m) => {
        if (m.role !== "user") return `AI: ${m.content}`;
        const hasScores =
          m.pronunciationScore != null ||
          m.pronunciationAccuracy != null ||
          m.pronunciationFluency != null ||
          m.pronunciationCompleteness != null ||
          m.pronunciationProsody != null;
        if (!hasScores) return `User: ${m.content}`;
        return `User (pronunciation: ${m.pronunciationScore ?? "-"}/100, accuracy: ${m.pronunciationAccuracy ?? "-"}, fluency: ${m.pronunciationFluency ?? "-"}, completeness: ${m.pronunciationCompleteness ?? "-"}, prosody: ${m.pronunciationProsody ?? "-"}): ${m.content}`;
      })
      .join("\n");

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: conversationText },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { ok: false, error: "Empty review response" };
    }

    const parsed = JSON.parse(raw);
    const validated = speakingReviewResultSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        ok: false,
        error: `Review validation failed: ${validated.error.message}`,
      };
    }

    return { ok: true, data: validated.data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI review error: ${msg}` };
  }
}
