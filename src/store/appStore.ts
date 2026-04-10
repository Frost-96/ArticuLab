import { create } from "zustand";

export type Page =
    | "dashboard"
    | "coach"
    | "writing"
    | "writing-review"
    | "speaking"
    | "speaking-review"
    | "pricing";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: Date;
    corrections?: {
        original: string;
        corrected: string;
        explanation: string;
    }[];
}

interface WritingSession {
    id: string;
    title: string;
    mode: "exam" | "daily";
    prompt: string;
    content: string;
    wordCount: number;
    timeSpent: number;
    score?: number;
    status: "draft" | "submitted" | "reviewed";
}

interface SpeakingSession {
    id: string;
    title: string;
    scenario: string;
    aiRole: string;
    duration: number;
    turns: number;
    fluencyScore?: number;
    accuracyScore?: number;
    status: "active" | "completed";
}

interface AppState {
    currentPage: Page;
    sidebarOpen: boolean;
    user: {
        name: string;
        email: string;
        avatar: string;
        plan: "free" | "pro";
        streak: number;
        totalSessions: number;
        studyTime: number;
    };

    // Coach state
    conversations: {
        id: string;
        title: string;
        lastMessage: string;
        timestamp: Date;
    }[];
    currentConversationId: string | null;
    messages: Message[];
    isStreaming: boolean;

    // Writing state
    writingSessions: WritingSession[];
    currentWritingSession: WritingSession | null;

    // Speaking state
    speakingSessions: SpeakingSession[];
    currentSpeakingSession: SpeakingSession | null;
    isRecording: boolean;

    // Actions
    setPage: (page: Page) => void;
    toggleSidebar: () => void;
    setCurrentConversation: (id: string | null) => void;
    addMessage: (message: Message) => void;
    setStreaming: (streaming: boolean) => void;
    setCurrentWritingSession: (session: WritingSession | null) => void;
    updateWritingContent: (content: string) => void;
    setCurrentSpeakingSession: (session: SpeakingSession | null) => void;
    setRecording: (recording: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentPage: "dashboard",
    sidebarOpen: true,
    user: {
        name: "Sarah Chen",
        email: "sarah@example.com",
        avatar: "SC",
        plan: "pro",
        streak: 12,
        totalSessions: 47,
        studyTime: 1240,
    },

    conversations: [
        {
            id: "1",
            title: "IELTS Writing Task 2 Help",
            lastMessage: "Let me explain the structure...",
            timestamp: new Date(Date.now() - 3600000),
        },
        {
            id: "2",
            title: "Grammar Practice",
            lastMessage: "Great improvement!",
            timestamp: new Date(Date.now() - 86400000),
        },
        {
            id: "3",
            title: "Speaking Fluency Tips",
            lastMessage: "Remember to pause naturally...",
            timestamp: new Date(Date.now() - 172800000),
        },
    ],
    currentConversationId: "1",
    messages: [
        {
            id: "1",
            role: "ai",
            content:
                "Hello! I'm your AI English coach. How can I help you today with your English learning journey?",
            timestamp: new Date(Date.now() - 3600000),
        },
        {
            id: "2",
            role: "user",
            content:
                "I need help with IELTS Writing Task 2. Can you explain how to structure an opinion essay?",
            timestamp: new Date(Date.now() - 3500000),
        },
        {
            id: "3",
            role: "ai",
            content:
                "Of course! An IELTS Task 2 opinion essay typically follows this structure:\n\n**Introduction (2-3 sentences)**\n- Paraphrase the question\n- State your opinion clearly\n\n**Body Paragraph 1 (5-7 sentences)**\n- Topic sentence with your first main point\n- Explanation and example\n\n**Body Paragraph 2 (5-7 sentences)**\n- Topic sentence with your second main point\n- Explanation and example\n\n**Conclusion (2-3 sentences)**\n- Restate your opinion\n- Summarize main points\n\nWould you like me to show you an example essay?",
            timestamp: new Date(Date.now() - 3400000),
        },
    ],
    isStreaming: false,

    writingSessions: [
        {
            id: "1",
            title: "IELTS Task 2 - Technology",
            mode: "exam",
            prompt: "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
            content: "",
            wordCount: 0,
            timeSpent: 0,
            status: "draft",
        },
        {
            id: "2",
            title: "Daily Writing #47",
            mode: "daily",
            prompt: "Describe a memorable journey you have taken. What made it special?",
            content: "Last summer, I embarked on...",
            wordCount: 245,
            timeSpent: 1200,
            status: "submitted",
        },
        {
            id: "3",
            title: "TOEFL Independent Task",
            mode: "exam",
            prompt: "Do you agree or disagree with the following statement? It is better to work in a team than to work alone.",
            content: "",
            wordCount: 312,
            timeSpent: 1800,
            score: 7.5,
            status: "reviewed",
        },
    ],
    currentWritingSession: null,

    speakingSessions: [
        {
            id: "1",
            title: "Job Interview Simulation",
            scenario:
                "You are interviewing for a marketing position at a tech company.",
            aiRole: "Hiring Manager",
            duration: 480,
            turns: 8,
            fluencyScore: 78,
            accuracyScore: 82,
            status: "completed",
        },
        {
            id: "2",
            title: "Hotel Check-in",
            scenario:
                "You arrive at a hotel and need to check in for your reservation.",
            aiRole: "Hotel Receptionist",
            duration: 0,
            turns: 0,
            status: "active",
        },
        {
            id: "3",
            title: "University Discussion",
            scenario: "Discuss your research project with your professor.",
            aiRole: "Professor",
            duration: 600,
            turns: 12,
            fluencyScore: 85,
            accuracyScore: 88,
            status: "completed",
        },
    ],
    currentSpeakingSession: null,
    isRecording: false,

    setPage: (page) => set({ currentPage: page }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setCurrentConversation: (id) => set({ currentConversationId: id }),
    addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
    setStreaming: (streaming) => set({ isStreaming: streaming }),
    setCurrentWritingSession: (session) =>
        set({ currentWritingSession: session }),
    updateWritingContent: (content) =>
        set((state) => ({
            currentWritingSession: state.currentWritingSession
                ? {
                      ...state.currentWritingSession,
                      content,
                      wordCount: content.split(/\s+/).filter((w) => w).length,
                  }
                : null,
        })),
    setCurrentSpeakingSession: (session) =>
        set({ currentSpeakingSession: session }),
    setRecording: (recording) => set({ isRecording: recording }),
}));
