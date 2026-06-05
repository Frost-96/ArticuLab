import { getWritingLlmClient, getWritingLlmModel } from "./llmClient";
import {
  writingReviewResultSchema,
  type WritingReviewResult,
} from "@/schema/writing.schema";
import type { AssessInput } from "@/types/writing/writingTypes";
import { buildWritingSystemPrompt } from "@/lib/aiPrompt";
import { SCORE_SCALES } from "./scoreScale";
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
  input: AssessInput,
): Promise<
  { ok: true; data: WritingReviewResult } | { ok: false; error: string }
> {
  const client = getWritingLlmClient();
  if (!client) {
    // Mock 数据（临时，待后续完善）
    return { ok: false, error: "LLM client not configured" };
  }

  const { min, max } = SCORE_SCALES[input.scenarioType];
  const model = getWritingLlmModel();

  const userMsg = [
    `Scenario type: ${input.scenarioType}`,
    `Score range for this task: ${min} to ${max}.`,
    `Word count (client): ${input.wordCount}`,
    `Prompt:\n${input.prompt}`,
    `Essay:\n${input.content}`,
  ].join("\n\n");

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: buildWritingSystemPrompt(input.scenarioType),
        },
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
