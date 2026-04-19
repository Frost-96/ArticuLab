import type { ScenarioType } from "../../../generated/prisma/enums";
import type { WritingScenarioType } from "@/schema"
import { getWritingLlmClient, getWritingLlmModel } from "./llmClient";
import { scoreRangeForScenarioType } from "./constants";
import { writingReviewResultSchema , type WritingReviewResult } from "@/schema/writing.schema";


/**
 * 批改入参（JSON语义）
 *   {
 *     "scenarioType": "string",    // Prisma ScenarioType
 *     "prompt": "string",           // 题目
 *     "content": "string",          // 作文正文
 *     "wordCount": "number"        // 客户端词数（与 content 已在校验层对齐）
 *   }
 */
export type AssessInput = {
  scenarioType: WritingScenarioType;
  prompt: string;
  content: string;
  wordCount: number;
  description?: string; // 题目的详细描述（可选，从scenario中获取）
};

/**
 * 将 WritingReviewResult 转换为适合存储的格式
 * （当前直接使用 WritingReviewResult，无需转换）
 */
function prepareFeedback(result: WritingReviewResult): WritingReviewResult {
  return result;
}

const SYSTEM_PROMPT = `You are an English writing examiner. Assess the user's essay against the given prompt.
Respond with a single JSON object only (no markdown), with this exact structure:
{
  "overallScore": number,
  "grammarScore": number,
  "vocabularyScore": number,
  "coherenceScore": number,
  "taskScore": number,
  "overallComment": string,
  "sentenceFeedback": [
    {
      "original": string,
      "corrected": string (optional),
      "severity": "error" | "warning" | "suggestion",
      "category": string,
      "explanation": string,
      "alternatives": string[] (optional)
    }
  ],
  "strengths": string[],
  "improvements": string[],
  "sampleExpressions": [
    {
      "original": string,
      "improved": string,
      "explanation": string
    }
  ] (optional)
}

IMPORTANT:
1. Score range: IELTS 0-9 or CET 0-100 depending on scenario type.
2. If a description is provided, evaluate task completion based on whether the essay addresses all requirements mentioned in the description.`;

/**
 * 执行一次 AI 批改（无 API Key 时返回 Mock；有 Key 时调用 chat.completions + json_object）
 *
 * 输入格式：
 * - input：AssessInput（见 AssessInput 上方 JSON 说明）
 *
 * 输出格式：
 * - 成功：{ "ok": true, "data": { ... } }  // data 为 WritingReviewResult
 * - 失败：{ "ok": false, "error": "string" }
 */
export async function assessWriting(
  input: AssessInput
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  const client = getWritingLlmClient();
  if (!client) {
    // Mock 数据（临时，待后续完善）
    return { ok: false, error: "LLM client not configured" };
  }

  const [minS, maxS] = scoreRangeForScenarioType(input.scenarioType);
  const model = getWritingLlmModel();

  const userMsg = [
    `Scenario type: ${input.scenarioType}`,
    `Score range for this task: ${minS} to ${maxS}.`,
    `Word count (client): ${input.wordCount}`,
    `Prompt:\n${input.prompt}`,
    `Essay:\n${input.content}`,
  ].join("\n\n");

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { ok: false, error: "Empty model response" };
    }

    const parsed = JSON.parse(raw);
    
    // 使用 Zod 校验 AI 返回结果
    //const validated = writingReviewResultSchema.safeParse(parsed);
    return { ok: true, data: parsed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
