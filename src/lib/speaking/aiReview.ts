// src/lib/speaking/aiReview.ts
// 口语练习 AI 评估反馈模块（支持参数化发音数据详细程度）

import type {
  SpeakingReviewResult,
  PronunciationResultLite,
} from "@/schema/speaking.schema";
import {
  speakingReviewResultSchema,
  pronunciationResultLiteSchema,
} from "@/schema/speaking.schema";
import type { MessageData } from "@/types/message/messageTypes";
import { getSpeakingLlmClient, getSpeakingLlmModel } from "./speakingLlmClient";

/** Review 消息构建选项 */
export type ReviewOptions = {
  /** 包含 5 个 Azure 总分，默认 true */
  score?: boolean;
  /** 包含逐词准确率和错误类型，默认 false */
  words?: boolean;
  /** 包含音素级别数据（隐含 words），默认 false */
  phonemes?: boolean;
};

/** AI 评估结果 */
export type ReviewResult =
  | { ok: true; data: SpeakingReviewResult }
  | { ok: false; error: string };

/**
 * 安全解析 pronunciationFeedback JSON（使用 Lite schema，phonemes 可选）
 *
 * @param raw - 原始 JSON 数据
 * @returns 解析后的 PronunciationResultLite 或 null
 */
function parsePronunciationFeedback(
  raw: unknown,
): PronunciationResultLite | null {
  if (!raw || typeof raw !== "object") return null;
  const result = pronunciationResultLiteSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * 根据选项格式化用户消息，附带发音分析数据
 *
 * @param message - 消息数据
 * @param options - 详细程度选项
 * @returns 格式化后的消息文本
 */
function formatUserMessage(
  message: MessageData,
  options: ReviewOptions,
): string {
  const { score = true, words = false, phonemes = false } = options;
  const parts: string[] = [];

  // 总分行
  if (score) {
    const hasScores =
      message.pronunciationScore != null ||
      message.pronunciationAccuracy != null ||
      message.pronunciationFluency != null ||
      message.pronunciationCompleteness != null ||
      message.pronunciationProsody != null;
    if (hasScores) {
      parts.push(
        `(pronunciation: ${message.pronunciationScore ?? "-"}/100, accuracy: ${message.pronunciationAccuracy ?? "-"}, fluency: ${message.pronunciationFluency ?? "-"}, completeness: ${message.pronunciationCompleteness ?? "-"}, prosody: ${message.pronunciationProsody ?? "-"})`,
      );
    }
  }

  // 逐词+音素行
  if (phonemes || words) {
    const feedback = parsePronunciationFeedback(message.pronunciationFeedback);
    if (feedback?.words?.length) {
      if (phonemes) {
        // 完整 JSON 格式（含 phonemes）
        const wordDetails = feedback.words.map((w) => ({
          word: w.word,
          accuracy: w.accuracyScore,
          ...(w.errorType ? { errorType: w.errorType } : {}),
          ...(w.phonemes?.length ? { phonemes: w.phonemes } : {}),
        }));
        parts.push(`Word details: ${JSON.stringify(wordDetails)}`);
      } else {
        // 紧凑格式（仅 word + accuracy + errorType）
        const wordStr = feedback.words
          .map(
            (w) =>
              `${w.word}(${w.accuracyScore}${w.errorType ? "/" + w.errorType : ""})`,
          )
          .join(" ");
        parts.push(`Word accuracy: ${wordStr}`);
      }
    }
  }

  const prefix = parts.length > 0 ? `User ${parts.join("\n")}` : "User";
  return `${prefix}: ${message.content}`;
}

/**
 * 构建口语评估的 system prompt（根据选项动态调整说明）
 *
 * @param scenarioType - 场景类型
 * @param scenarioRole - AI 扮演的角色
 * @param options - 详细程度选项
 * @returns system prompt 文本
 */
function buildReviewPrompt(
  scenarioType: string,
  scenarioRole: string,
  options: ReviewOptions,
): string {
  const { score = true, words = false, phonemes = false } = options;

  let pronunciationGuide = "";

  if (score) {
    pronunciationGuide += `
Each user message may include Azure Pronunciation Assessment scores (0-100 scale):
- pronunciationScore: overall pronunciation quality
- accuracyScore: phoneme-level accuracy
- fluencyScore: speech fluency (pace, pauses)
- completenessScore: completeness (missing/extra words)
- prosodyScore: prosody (intonation, stress, rhythm)

Use these audio scores alongside your text analysis to produce a comprehensive evaluation.`;
  }

  if (words) {
    pronunciationGuide += `
Each user message may also include word-level accuracy data in the format:
Word accuracy: word1(score) word2(score/ErrorType) ...
- score: per-word pronunciation accuracy (0-100)
- ErrorType: optional error type (e.g., Omission, Insertion, Mispronunciation)
Use word-level data to identify specific pronunciation weaknesses.`;
  }

  if (phonemes) {
    pronunciationGuide += `
Each user message may also include phoneme-level details in JSON format:
Word details: [{"word":"...","accuracy":95,"phonemes":[{"phoneme":"HH","accuracy":90},...]}]
- Each word contains an array of phonemes with individual accuracy scores
- Use phoneme-level data to provide precise pronunciation feedback on specific sounds.`;
  }

  return `You are an English speaking examiner. Analyze the following conversation and provide a detailed review.

Scenario type: ${scenarioType}
AI role: ${scenarioRole}
Pronunciation data: ${pronunciationGuide.trim() || "none"}

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
 * @param options - 发音数据详细程度选项
 * @returns 结构化的评估结果
 */
export async function generateSpeakingReview(
  conversationHistory: MessageData[],
  scenarioType: string,
  scenarioRole: string,
  options?: ReviewOptions,
): Promise<ReviewResult> {
  const client = getSpeakingLlmClient();
  if (!client) {
    return { ok: false, error: "Speaking LLM client not configured" };
  }

  try {
    const model = getSpeakingLlmModel();
    const opts: ReviewOptions = {
      score: true,
      words: false,
      phonemes: false,
      ...options,
    };
    const systemPrompt = buildReviewPrompt(scenarioType, scenarioRole, opts);

    // 构建对话文本用于评估
    const conversationText = conversationHistory
      .map((m) => {
        if (m.role !== "user") return `AI: ${m.content}`;
        return formatUserMessage(m, opts);
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
