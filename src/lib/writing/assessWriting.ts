//import type { ScenarioType } from "../../../generated/prisma/enums";
import type { WritingScenarioType } from "@/schema"
import { getWritingLlmClient, getWritingLlmModel } from "./llmClient";
import { writingReviewResultSchema , type WritingReviewResult } from "@/schema/writing.schema";
import type { AssessInput } from "@/types/writing/writingTypes";
import { SYSTEM_WRITING_PROMPT } from "@/lib/aiPrompt";
/**
 * 批改入参（JSON语义）
 *   {
 *     "scenarioType": "string",    // Prisma ScenarioType
 *     "prompt": "string",           // 题目
 *     "content": "string",          // 作文正文
 *     "wordCount": "number"        // 客户端词数（与 content 已在校验层对齐）
 *   }
 */


/**
 * 按场景类型返回分数区间
 *
 * 输入格式：
 * - t：ScenarioType（Prisma 枚举）
 *
 * 输出格式：
 * - [min, max]：二元组，number
 */

export function scoreRangeForScenarioType(
  t: WritingScenarioType
): [number, number] {
  if (t === "ielts_task1" || t === "ielts_task2") return [0, 9];
  if (t === "cet4" || t === "cet6") return [0, 100];
  return [0, 9];
}
/**
 * 将 WritingReviewResult 转换为适合存储的格式
 * （当前直接使用 WritingReviewResult，无需转换）
 */
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
): Promise<{ ok: true; data: WritingReviewResult } | { ok: false; error: string }> {
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
        { role: "system", content: SYSTEM_WRITING_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { ok: false, error: "Empty model response" };
    }

    const parsed = writingReviewResultSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }

    return { ok: true, data: parsed.data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
