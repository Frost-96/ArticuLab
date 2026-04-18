import type { WritingScenarioType } from "@/schema";
import { getWritingLlmClient, getWritingLlmModel } from "./llmClient";
import { scoreRangeForScenarioType } from "./constants";
import type {
  IssueItem,
  ModelEssay,
  StoredWritingFeedback,
  SuggestionCategoryBlock,
} from "./feedbackTypes";

/**
 * 批改入参（JSON语义）
 *   {
 *     "scenarioType": "string",    // WritingScenarioType
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

function mockAssessment(
  input: AssessInput,
): Omit<StoredWritingFeedback, "_meta"> {
  const [minS, maxS] = scoreRangeForScenarioType(input.scenarioType);
  const span = maxS - minS;
  const overall = minS + span * 0.72;

  const issues: IssueItem[] = [
    {
      id: 1,
      type: "error",
      severity: "high",
      sentence: "Example placeholder sentence.",
      correction: "Corrected example sentence.",
      explanation: "Mock assessment without LLM key.",
      position: { start: 0, end: 10 }, // 词位置示例
      category: "grammar",
    },
  ];

  const suggestions: SuggestionCategoryBlock[] = [
    {
      category: "grammar",
      title: "语法改进建议",
      description: "（Mock）请配置 WRITING_LLM_API_KEY 获取真实批改。",
      items: [
        {
          issueId: 1,
          original: "Example",
          improved: "Improved example",
          explanation: "Mock suggestion.",
        },
      ],
    },
  ];

  const modelEssay: ModelEssay = {
    title: "参考范文（Mock）",
    content:
      "This is a placeholder model essay. Configure LLM for real content.",
    analysis: "Mock analysis.",
  };

  return {
    scores: {
      overall: Math.round(overall * 10) / 10,
      grammar: Math.round((overall - 0.3) * 10) / 10,
      vocabulary: Math.round((overall + 0.2) * 10) / 10,
      coherence: Math.round(overall * 10) / 10,
      taskCompletion: Math.round(overall * 10) / 10,
    },
    feedback: {
      summary:
        "当前为离线 Mock 批改。请在环境变量中配置 WRITING_LLM_API_KEY（及可选 WRITING_LLM_BASE_URL、WRITING_LLM_MODEL）以启用真实模型。",
      issues,
    },
    suggestionsPayload: {
      suggestions,
      modelEssay,
    },
  };
}

const SYSTEM_PROMPT = `You are an English writing examiner. Assess the user's essay against the given prompt.
Respond with a single JSON object only (no markdown), with this exact structure:
{
  "scores": {
    "overall": number,
    "grammar": number,
    "vocabulary": number,
    "coherence": number,
    "taskCompletion": number
  },
  "feedback": {
    "summary": string,
    "issues": [
      {
        "id": number,
        "type": "error" | "suggestion" | "enhancement",
        "severity": "high" | "medium" | "low",
        "sentence": string,
        "correction": string,
        "explanation": string,
        "position": { "start": number, "end": number },
        "category": string
      }
    ]
  },
  "suggestionsPayload": {
    "suggestions": [
      {
        "category": string,
        "title": string,
        "description": string,
        "items": [object]
      }
    ],
    "modelEssay": {
      "title": string,
      "content": string,
      "analysis": string
    }
  }
}

IMPORTANT:
1. For issue positions, use WORD indices, not character indices. For example, if "This is an example" has an error in "example", start: 3, end: 4 (not character positions).
2. If a description is provided, evaluate task completion based on whether the essay addresses all requirements mentioned in the description.
3. Use the score scale indicated in the user message (IELTS 0-9 or CET 0-100).`;

/**
 * 执行一次 AI 批改（无 API Key 时返回 Mock；有 Key 时调用 chat.completions + json_object）
 *
 * 输入格式：
 * - input：AssessInput（见 AssessInput 上方 JSON 说明）
 *
 * 输出格式：
 * - 成功：{ "ok": true, "data": { ... } }  // data 同 StoredWritingFeedback 去掉 _meta，由路由合并时间戳
 * - 失败：{ "ok": false, "error": "string" }
 */
export async function assessWriting(
  input: AssessInput,
): Promise<
  | { ok: true; data: Omit<StoredWritingFeedback, "_meta"> }
  | { ok: false; error: string }
> {
  const client = getWritingLlmClient();
  if (!client) {
    return { ok: true, data: mockAssessment(input) };
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

    const parsed = JSON.parse(raw) as Omit<StoredWritingFeedback, "_meta">;

    if (
      !parsed.scores ||
      typeof parsed.scores.overall !== "number" ||
      !parsed.feedback?.summary
    ) {
      return { ok: false, error: "Invalid model JSON shape" };
    }

    return { ok: true, data: parsed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
