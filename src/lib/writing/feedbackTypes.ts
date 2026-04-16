/**
 * 持久化在 WritingExercise.feedback（Json）内的结构说明（不新增表字段）
 *
 * 典型结构（JSON格式）：
 *   {
 *     "_meta": {
 *       "lastSavedAt": "string",     // 可选，ISO 8601
 *       "submittedAt": "string",     // 可选
 *       "evaluatedAt": "string"      // 可选
 *     },
 *     "scores": {
 *       "overall": "number",
 *       "grammar": "number",
 *       "vocabulary": "number",
 *       "coherence": "number",
 *       "taskCompletion": "number"
 *     },
 *     "feedback": {
 *       "summary": "string",
 *       "issues": []                 // IssueItem 数组
 *     },
 *     "suggestionsPayload": {
 *       "suggestions": [],            // SuggestionCategoryBlock 数组
 *       "modelEssay": {
 *         "title": "string",
 *         "content": "string",
 *         "analysis": "string"
 *       }
 *     }
 *   }
 */

export type FeedbackMeta = {
  lastSavedAt?: string;
  submittedAt?: string;
  evaluatedAt?: string;
};

export type IssueItem = {
  id: number;
  type: "error" | "suggestion" | "enhancement";
  severity: "high" | "medium" | "low";
  sentence: string;
  correction: string;
  explanation: string;
  position: { start: number; end: number };
  category?: string;
};

export type SuggestionCategoryBlock = {
  category: string;
  title: string;
  description: string;
  items: Array<Record<string, unknown>>;
};

export type ModelEssay = {
  title: string;
  content: string;
  analysis: string;
};

export type StoredWritingFeedback = {
  _meta?: FeedbackMeta;
  scores?: {
    overall: number;
    grammar: number;
    vocabulary: number;
    coherence: number;
    taskCompletion: number;
  };
  feedback?: {
    summary: string;
    issues: IssueItem[];
  };
  suggestionsPayload?: {
    suggestions: SuggestionCategoryBlock[];
    modelEssay?: ModelEssay;
  };
};

/**
 * 将 Prisma Json 安全转为 StoredWritingFeedback
 *
 * 输入格式：
 * - raw：unknown（WritingExercise.feedback）
 *
 * 输出格式：
 * - StoredWritingFeedback；非 object 时返回 {}
 */
export function parseFeedback(raw: unknown): StoredWritingFeedback {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as StoredWritingFeedback;
  }
  return {};
}
