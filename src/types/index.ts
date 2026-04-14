import type React from "react";

// ─── UI / Nav ─────────────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
  avatar: string;
  plan: "free" | "pro";
  streak: number;
  totalSessions: number;
  studyTime: number;
}

// ─── Writing ──────────────────────────────────────────────────────────────────

export type ExamType =
  | "ielts-task1"
  | "ielts-task2"
  | "toefl"
  | "cet4"
  | "cet6"
  | "kaoyan";

export type WritingMode = "daily" | "exam";

export type WritingStatus = "draft" | "submitted" | "reviewed";

export interface WritingSession {
  id: string;
  title: string;
  mode: WritingMode;
  examType?: ExamType;
  prompt: string;
  content: string;
  wordCount: number;
  timeSpent: number;
  score?: number;
  status: WritingStatus;
  createdAt?: Date;
}

export interface ExamConfig {
  id: ExamType;
  label: string;
  shortLabel: string;
  /** Tailwind classes for badge pill */
  badgeColor: string;
  /** Tailwind classes for active pill selector */
  pillActive: string;
  /** e.g. "250+ words" */
  wordTarget: number;
  wordRange: string;
  /** e.g. "40 min" */
  timeLimit: string;
  description: string;
  prompts: string[];
}

export const WRITING_STATUS_CONFIG: Record<
  WritingStatus,
  { label: string; color: string }
> = {
  reviewed: { label: "Reviewed", color: "text-emerald-600 border-emerald-200" },
  submitted: { label: "Submitted", color: "text-indigo-600 border-indigo-200" },
  draft: { label: "Draft", color: "text-slate-500 border-slate-200" },
};

// ─── Speaking ─────────────────────────────────────────────────────────────────

export type SpeakingStatus = "active" | "completed";

export interface SpeakingSession {
  id: string;
  title: string;
  scenario: string;
  aiRole: string;
  duration: number;
  turns: number;
  fluencyScore?: number;
  accuracyScore?: number;
  status: SpeakingStatus;
  createdAt?: Date;
}

// ─── Coach ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "ai";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

export interface CoachConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}
