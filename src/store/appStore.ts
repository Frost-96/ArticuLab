import { create } from "zustand";
import type {
    WritingScenarioType,
    SpeakingScenarioType,
    MembershipTier,
    EnglishLevel,
} from "@/schema";

// ─── Domain Types (derived from validators) ───────────────────────────────────

interface User {
    name?: string;
    email: string;
    avatar?: string;
    plan: MembershipTier;
    englishLevel?: EnglishLevel;
    streak: number;
    totalSessions: number;
    studyTime: number;
}

interface WritingSession {
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

interface SpeakingSession {
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

// ─── State & Actions ──────────────────────────────────────────────────────────

interface AppState {
    // UI
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    activeConversationId: string | null;

    // User
    user: User;

    // Writing
    writingSessions: WritingSession[];
    currentWritingSession: WritingSession | null;

    // Speaking
    speakingSessions: SpeakingSession[];
    currentSpeakingSession: SpeakingSession | null;

    // Actions – UI
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    toggleSidebarCollapse: () => void;
    setActiveConversation: (id: string | null) => void;

    // Actions – Writing
    setCurrentWritingSession: (session: WritingSession | null) => void;
    updateWritingContent: (content: string) => void;
    saveWritingSession: (session: WritingSession) => void;

    // Actions – Speaking
    setCurrentSpeakingSession: (session: SpeakingSession | null) => void;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_WRITING_SESSIONS: WritingSession[] = [
    {
        id: "1",
        title: "IELTS Task 2 - Technology",
        scenarioType: "ielts_task2",
        prompt: "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
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
        prompt: "Describe a memorable journey you have taken. What made it special?",
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
        scenarioType: "cet6",
        prompt: "Do you agree or disagree with the following statement? It is better to work in a team than to work alone.",
        isCustomPrompt: false,
        content: "",
        wordCount: 312,
        timeSpent: 1800,
        overallScore: 7.5,
        status: "reviewed",
        createdAt: new Date(Date.now() - 72 * 3600_000),
    },
];

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

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
    // UI
    sidebarOpen: false,
    sidebarCollapsed: false,
    activeConversationId: null,

    // User
    user: {
        name: "Sarah Chen",
        email: "sarah@example.com",
        plan: "pro",
        streak: 12,
        totalSessions: 47,
        studyTime: 1240,
    },

    // Writing
    writingSessions: SEED_WRITING_SESSIONS,
    currentWritingSession: null,

    // Speaking
    speakingSessions: SEED_SPEAKING_SESSIONS,
    currentSpeakingSession: null,

    // Actions – UI
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    toggleSidebarCollapse: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setActiveConversation: (id) => set({ activeConversationId: id }),

    // Actions – Writing
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
                    ? s.writingSessions.map((w) =>
                          w.id === session.id ? session : w,
                      )
                    : [session, ...s.writingSessions],
                currentWritingSession: session,
            };
        }),

    // Actions – Speaking
    setCurrentSpeakingSession: (session) =>
        set({ currentSpeakingSession: session }),
}));
