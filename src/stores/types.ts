import type {
  EnglishLevel,
  MembershipTier,
  SpeakingScenarioType,
  WritingScenarioType,
} from "@/schema";

export interface User {
  name?: string;
  email: string;
  avatar?: string;
  plan: MembershipTier;
  englishLevel?: EnglishLevel;
  streak: number;
  totalSessions: number;
  studyTime: number;
}

export interface WritingSession {
  id: string;
  title: string;
  scenarioType: WritingScenarioType;
  prompt: string;
  isCustomPrompt: boolean;
  content: string;
  wordCount: number;
  timeSpent: number;
  status: "draft" | "submitted" | "reviewed";
  overallScore?: number;
  createdAt: Date;
}

export interface SpeakingSession {
  id: string;
  title: string;
  scenarioType: SpeakingScenarioType;
  scenario: string;
  aiRole: string;
  duration: number;
  turns: number;
  fluencyScore?: number;
  accuracyScore?: number;
  status: "active" | "completed";
  createdAt: Date;
}
