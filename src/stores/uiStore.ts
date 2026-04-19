import { create } from "zustand";
import type { User } from "./types";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeConversationId: string | null;
  user: User;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setActiveConversation: (id: string | null) => void;
}

const DEFAULT_USER: User = {
  name: "Sarah Chen",
  email: "sarah@example.com",
  plan: "pro",
  streak: 12,
  totalSessions: 47,
  studyTime: 1240,
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeConversationId: null,
  user: DEFAULT_USER,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapse: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
