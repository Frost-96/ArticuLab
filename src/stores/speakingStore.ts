import { create } from "zustand";
import type { SpeakingSession } from "./types";

interface SpeakingState {
  speakingSessions: SpeakingSession[];
  currentSpeakingSession: SpeakingSession | null;
  setCurrentSpeakingSession: (session: SpeakingSession | null) => void;
}

const SEED_SPEAKING_SESSIONS: SpeakingSession[] = [
  {
    id: "1",
    title: "Job Interview Simulation",
    scenarioType: "interview",
    scenario:
      "You are interviewing for a marketing position at a tech company.",
    aiRole: "Hiring Manager",
    duration: 480,
    turns: 8,
    fluencyScore: 78,
    accuracyScore: 82,
    status: "completed",
    createdAt: new Date(Date.now() - 5 * 3600_000),
  },
  {
    id: "2",
    title: "Hotel Check-in",
    scenarioType: "travel",
    scenario:
      "You arrive at a hotel and need to check in for your reservation.",
    aiRole: "Hotel Receptionist",
    duration: 0,
    turns: 0,
    status: "active",
    createdAt: new Date(Date.now() - 30 * 3600_000),
  },
  {
    id: "3",
    title: "University Discussion",
    scenarioType: "free",
    scenario: "Discuss your research project with your professor.",
    aiRole: "Professor",
    duration: 600,
    turns: 12,
    fluencyScore: 85,
    accuracyScore: 88,
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 86_400_000),
  },
];

export const useSpeakingStore = create<SpeakingState>((set) => ({
  speakingSessions: SEED_SPEAKING_SESSIONS,
  currentSpeakingSession: null,
  setCurrentSpeakingSession: (session) =>
    set({ currentSpeakingSession: session }),
}));
