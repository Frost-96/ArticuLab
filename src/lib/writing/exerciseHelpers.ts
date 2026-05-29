import type { WritingExerciseStatus, WritingReviewResult } from "@/schema";

export function parseFeedback(raw: unknown): WritingReviewResult | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as WritingReviewResult;
  }

  return null;
}

export function getFeedback(ex: {
  feedback: unknown;
}): WritingReviewResult | null {
  return parseFeedback(ex.feedback);
}

export function isGraded(ex: { overallScore: number | null }): boolean {
  return ex.overallScore != null;
}

export function inferExerciseStatus(ex: {
  overallScore: number | null;
  status?: string | null;
}): WritingExerciseStatus {
  if (ex.status === "completed") {
    return "reviewed";
  }

  if (
    ex.status === "draft" ||
    ex.status === "submitted" ||
    ex.status === "reviewing" ||
    ex.status === "reviewed" ||
    ex.status === "failed"
  ) {
    return ex.status;
  }

  return isGraded(ex) ? "reviewed" : "draft";
}
