export type CoachConversationSummary = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    preview: string | null;
};

export type CoachMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    audioUrl: string | null;
    createdAt: string;
};

export type CoachConversationDetail = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: CoachMessage[];
};

export type CoachPageData = {
    conversations: CoachConversationSummary[];
    activeConversation: CoachConversationDetail | null;
};
