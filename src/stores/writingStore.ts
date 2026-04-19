import { create } from "zustand";
import type { WritingSession } from "./types";

interface WritingState {
  writingSessions: WritingSession[];
  currentWritingSession: WritingSession | null;
  setCurrentWritingSession: (session: WritingSession | null) => void;
  updateWritingContent: (content: string) => void;
  saveWritingSession: (session: WritingSession) => void;
}

const SEED_WRITING_SESSIONS: WritingSession[] = [
  {
    id: "1",
    title: "IELTS Task 2 - Technology",
    scenarioType: "ielts_task2",
    prompt:
      "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
    isCustomPrompt: false,
    content: "",
    wordCount: 0,
    timeSpent: 0,
    status: "draft",
    createdAt: new Date(Date.now() - 2 * 3600_000),
  },
  {
    id: "2",
    title: "Daily Writing #47",
    scenarioType: "daily",
    prompt:
      "Describe a memorable journey you have taken. What made it special?",
    isCustomPrompt: false,
    content: "Last summer, I embarked on...",
    wordCount: 245,
    timeSpent: 1200,
    status: "submitted",
    createdAt: new Date(Date.now() - 26 * 3600_000),
  },
  {
    id: "3",
    title: "TOEFL Independent Task",
    scenarioType: "toefl",
    prompt:
      "Do you agree or disagree with the following statement? It is better to work in a team than to work alone.",
    isCustomPrompt: false,
    content: "",
    wordCount: 312,
    timeSpent: 1800,
    overallScore: 7.5,
    status: "reviewed",
    createdAt: new Date(Date.now() - 72 * 3600_000),
  },
];

export const useWritingStore = create<WritingState>((set) => ({
  writingSessions: SEED_WRITING_SESSIONS,
  currentWritingSession: null,
  setCurrentWritingSession: (session) =>
    set({ currentWritingSession: session }),
  updateWritingContent: (content) =>
    set((s) => ({
      currentWritingSession: s.currentWritingSession
        ? {
            ...s.currentWritingSession,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
          }
        : null,
    })),
  saveWritingSession: (session) =>
    set((s) => {
      const exists = s.writingSessions.some((w) => w.id === session.id);
      return {
        writingSessions: exists
          ? s.writingSessions.map((w) => (w.id === session.id ? session : w))
          : [session, ...s.writingSessions],
        currentWritingSession: session,
      };
    }),
}));
