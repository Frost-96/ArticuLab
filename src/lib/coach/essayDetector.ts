import { countWords } from "@/lib/writing/words";
import { getCoachLlmClient, getCoachLlmModel } from "./coachLlmClient";

// ==================== 规则层（30 ≤ 词数 < 80） ====================

/** 规则检测英语作文特征 */
function ruleBasedEssayDetection(message: string): boolean {
  const trimmed = message.trim();
  let score = 0;

  // 1. 有段落分隔（连续换行）
  if (/\n\s*\n/.test(trimmed)) {
    score += 2;
  }

  // 2. 首行类似标题（短于 80 字符且不以句末标点结尾）
  const lines = trimmed.split("\n").filter((l) => l.trim());
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length < 80 && !/[.!?]$/.test(firstLine)) {
    score += 1;
  }

  // 3. 平均句长 > 15 词
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim());
  if (sentences.length >= 3) {
    const avgWords =
      sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length;
    if (avgWords > 15) score += 2;
  }

  // 4. 多段落（≥ 3 个非空行）
  if (lines.length >= 3) {
    score += 1;
  }

  return score >= 3;
}

// ==================== LLM 层（词数 ≥ 80） ====================

const ESSAY_DETECTOR_SYSTEM_PROMPT =
  "You are an essay detector. Reply with only one word: ESSAY or CHAT. " +
  "An essay is a structured piece of writing with paragraphs, a clear topic, " +
  "and formal language. CHAT is casual conversation, questions, or short informal messages.";

/** LLM 分类是否为英语作文 */
async function llmEssayDetection(message: string): Promise<boolean> {
  const client = getCoachLlmClient();
  if (!client) return false;

  try {
    const completion = await client.chat.completions.create({
      model: getCoachLlmModel(),
      messages: [
        { role: "system", content: ESSAY_DETECTOR_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const result = completion.choices[0]?.message?.content
      ?.trim()
      .toUpperCase();
    return result?.startsWith("ESSAY") ?? false;
  } catch {
    return false;
  }
}

// ==================== 入口 ====================

/**
 * 三级作文检测
 *
 * - 词数 < 30：直接返回 false（不可能是作文）
 * - 30 ≤ 词数 < 80：规则启发式检测
 * - 词数 ≥ 80：LLM 分类
 */
export async function detectEssay(message: string): Promise<boolean> {
  const words = countWords(message);

  if (words < 30) return false;
  if (words < 80) return ruleBasedEssayDetection(message);
  return llmEssayDetection(message);
}
