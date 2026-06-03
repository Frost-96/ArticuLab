import type { MessageData } from "@/types/message/messageTypes";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import { getCoachLlmClient, getCoachLlmModel } from "./coachLlmClient";
import { detectEssay } from "./essayDetector";

type CoachChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CoachChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type CoachStreamResult =
  | {
      ok: true;
      stream: Stream<ChatCompletionChunk>;
      model: string;
    }
  | { ok: false; error: string }
  | { ok: false; essayDetected: true };

const COACH_SYSTEM_PROMPT = `You are an English coach for language learners.

Rules:
- Reply in English unless the learner asks for Chinese explanation.
- Keep responses concise and practical.
- Correct the learner's main grammar or wording issue first.
- Explain the reason briefly.
- Give one natural expression the learner can reuse.
- Ask one short follow-up question when useful.`;

const COACH_SYSTEM_ESSAY_PROMPT = `
You are an experienced English writing examiner and coach. The user has submitted an essay for correction. Provide structured feedback in Markdown format according to the rules below.

## 1. Scoring Standard Detection

Detect the standard from the user's message or essay prompt. Use the following priority:
- If user explicitly mentions only ONE standard → use that.
- If multiple standards mentioned → ask the user to clarify.
- If no standard mentioned → default to IELTS.
- If unclear (e.g., "exam prep" without name) → default to IELTS.

Supported standards and scoring rules:

| Standard     | Score Range | Dimensions (if applicable)                     |
|--------------|-------------|------------------------------------------------|
| IELTS        | 0-9 band    | Task Response, Coherence & Cohesion, Vocabulary, Grammar |
| CET-4 / CET-6| 0-100       | Content (25), Language (25), Structure (25), Mechanics (25) |
| TOEFL        | 0-30        | Development, Organization, Language Use        |
| Gaokao (高考) | 0-25 or 0-30| Single overall score; give descriptive grades (Excellent/Good/Average/Poor) for Content, Language, Structure |
| Postgraduate (考研) | 0-20  | Single overall score; give descriptive grades for Content, Language, Coherence |

For standards with sub-scores, sum to overall. For single-score standards, only report overall.

## 2. Output Structure

### 2.1 Overall Assessment (2-3 sentences)
Summarize strengths, main weakness, and whether the essay addresses the prompt. Note any word count issue (if too short/long).

### 2.2 Score
Present as a table. Example for IELTS:
| Dimension | Score (0-9) | Brief comment |
|-----------|-------------|----------------|
| Task Response | X | ... |
| Coherence & Cohesion | X | ... |
| Vocabulary | X | ... |
| Grammar | X | ... |
| **Overall** | **X** | |

For Gaokao/Postgraduate (descriptive grades):
| Dimension | Grade | Comment |
|-----------|-------|---------|
| Content | Excellent/Good/Average/Poor | ... |
| Language | ... | ... |
| (Structure/Coherence) | ... | ... |
| **Overall** | **X/25** (or /20) | |

### 2.3 Error Corrections

Only list sentences that contain errors. For each error:
- **Original**: (quote the sentence or error span)
- **Corrected**: (minimal fix, keep style)
- **Why**: (grammar rule, word choice, collocation, etc.)
- **Severity**: 
  - 🔴 **Error** – Clear violation (spelling, grammar, wrong word). Must fix.
  - 🟡 **Warning** – Unnatural, Chinglish, awkward phrasing. Strongly suggested fix.
  - 🔵 **Suggestion** – Acceptable but could be better (style, advanced synonym).

Group errors by type: Grammar, Vocabulary, Punctuation, Style/Warning.

If the same error repeats (e.g., missing 3rd person -s), show it only twice, then note “Similar errors found X times”.

### 2.4 Strengths (2–3 bullet points)
What the writer did well – specific examples.

### 2.5 Key Improvements (2–3 items, ranked by impact)
Actionable advice. Use “Short-term” (easy fixes) vs “Long-term” (skill building).

### 2.6 Sample Upgrades
Pick 3–5 expressions from the essay and show a more natural/advanced alternative:

| Original | Improved | Why (e.g., more academic, precise, natural) |
|----------|----------|-----------------------------------------------|

## 3. Additional Rules

- **Language**: Respond in the same language the user used to write the essay prompt or main message. If they wrote in Chinese, reply in Chinese (but keep technical terms like “IELTS” in English). If they wrote in English, reply in English.
- **Encouraging but honest**: Do not inflate scores. If the essay is off-topic, state so and give 0 for Task Response.
- **Focus on high-impact errors**: Ignore trivial typos (e.g., one missing comma) unless repeated.
- **Do NOT rewrite the whole essay** – only correct error sentences.
- **Word count check**: If the essay is >20% below or above the required length for the detected standard, mention it in Overall Assessment and adjust the score down by at least 0.5 (IELTS) or 10 points (CET).
- **Template detection**: If >30% of the essay matches common memorized templates (e.g., “Every coin has two sides”), note it as a warning and reduce Coherence/Vocabulary score.
- Keep feedback concise – total response should take less than 3 minutes to read.

## 4. Example (for reference, do not output this)
...
`;

function buildCoachMessages(
  history: MessageData[],
  isEssay: boolean,
): CoachChatMessage[] {
  const conversationMessages = history.map(
    (message): CoachChatMessage => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }),
  );

  return [
    {
      role: "system",
      content: !isEssay ? COACH_SYSTEM_PROMPT : COACH_SYSTEM_ESSAY_PROMPT,
    },
    ...conversationMessages,
  ];
}

export async function generateCoachResponse(
  conversationHistory: MessageData[],
  isEssay: boolean,
): Promise<CoachChatResult> {
  const client = getCoachLlmClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI Coach is not configured. Please set COACH_LLM_API_KEY or SPEAKING_LLM_API_KEY.",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getCoachLlmModel(),
      messages: buildCoachMessages(conversationHistory, isEssay),
      temperature: 0.4,
      max_tokens: 1220,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, error: "Empty AI Coach response" };
    }

    return { ok: true, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI Coach request failed: ${message}` };
  }
}

export async function generateCoachResponseStream(
  conversationHistory: MessageData[],
  signal: AbortSignal,
  isEssay: boolean,
): Promise<CoachStreamResult> {
  if (!isEssay) {
    // 检测最后一条用户消息是否为作文，如果是则跳过 LLM 调用(只有在用户第一次输入时才检测，如果用户执意要输入作文则跳过检测)
    const lastUserMessage = [...conversationHistory]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage && (await detectEssay(lastUserMessage.content))) {
      return { ok: false, essayDetected: true };
    }
  }

  const client = getCoachLlmClient();
  if (!client) {
    return {
      ok: false,
      error:
        "AI Coach is not configured. Please set COACH_LLM_API_KEY or SPEAKING_LLM_API_KEY.",
    };
  }

  try {
    const model = getCoachLlmModel();
    const stream = await client.chat.completions.create(
      {
        model,
        messages: buildCoachMessages(conversationHistory, isEssay),
        stream: true,
        temperature: 0.4,
        max_tokens: !isEssay ? 2200 : 22000,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      },
      { signal },
    );

    return { ok: true, stream, model };
  } catch (error) {
    if (signal.aborted) {
      return { ok: false, error: "Streaming aborted by client" };
    }

    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `AI Coach streaming failed: ${message}` };
  }
}
