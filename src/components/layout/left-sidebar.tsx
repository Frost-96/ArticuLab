"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  MessageSquare,
  PenLine,
  Mic,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/appStore";

// ─── Mock coach history (no store model yet) ─────────────────────────────────

const coachHistory = [
  {
    id: "c1",
    title: "Grammar practice session",
    date: new Date(Date.now() - 2 * 3600_000),
  },
  {
    id: "c2",
    title: "IELTS writing tips",
    date: new Date(Date.now() - 26 * 3600_000),
  },
  {
    id: "c3",
    title: "Vocabulary building",
    date: new Date(Date.now() - 50 * 3600_000),
  },
  {
    id: "c4",
    title: "Speaking fluency",
    date: new Date(Date.now() - 74 * 3600_000),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return `${diffD} days ago`;
}

function groupByDay<T extends { date: Date }>(
  items: T[],
): { label: string; items: T[] }[] {
  const today: T[] = [];
  const yesterday: T[] = [];
  const older: T[] = [];
  const now = Date.now();
  for (const item of items) {
    const diffH = (now - item.date.getTime()) / 3_600_000;
    if (diffH < 24) today.push(item);
    else if (diffH < 48) yesterday.push(item);
    else older.push(item);
  }
  const groups: { label: string; items: T[] }[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (older.length) groups.push({ label: "Earlier", items: older });
  return groups;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarType = "coach" | "writing" | "speaking";

interface LeftSidebarProps {
  type: SidebarType;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeftSidebar({ type }: LeftSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    activeConversationId,
    setActiveConversation,
    writingSessions,
    speakingSessions,
    setCurrentWritingSession,
    setCurrentSpeakingSession,
  } = useAppStore();

  // ── Normalise data into a common shape ────────────────────────────────────
  type Item = {
    id: string;
    title: string;
    date: Date;
    badge?: string;
    href: string;
  };

  const items: Item[] = (() => {
    switch (type) {
      case "writing":
        return writingSessions.map((s) => ({
          id: s.id,
          title: s.title,
          date: new Date(Date.now() - Math.random() * 7 * 86_400_000), // mock dates
          badge: s.score ? String(s.score) : undefined,
          href: `/writing/${s.id}`,
        }));
      case "speaking":
        return speakingSessions.map((s) => ({
          id: s.id,
          title: s.title,
          date: new Date(Date.now() - Math.random() * 7 * 86_400_000),
          badge: s.fluencyScore ? `${s.fluencyScore}%` : undefined,
          href: `/speaking/${s.id}`,
        }));
      default:
        return coachHistory.map((c) => ({
          ...c,
          href: `/coach?id=${c.id}`,
        }));
    }
  })();

  const groups = groupByDay(items);

  // ── New button action ─────────────────────────────────────────────────────
  const handleNew = () => {
    if (type === "writing") {
      setCurrentWritingSession(null);
      router.push("/writing");
    } else if (type === "speaking") {
      setCurrentSpeakingSession(null);
      router.push("/speaking");
    } else {
      router.push("/coach");
    }
  };

  // ── Item click ────────────────────────────────────────────────────────────
  const handleItemClick = (item: Item) => {
    setActiveConversation(item.id);
    if (type === "writing") {
      const session = writingSessions.find((s) => s.id === item.id);
      if (session) setCurrentWritingSession(session);
    } else if (type === "speaking") {
      const session = speakingSessions.find((s) => s.id === item.id);
      if (session) setCurrentSpeakingSession(session);
    }
    router.push(item.href);
  };

  const newLabel = {
    coach: "New Chat",
    writing: "New Essay",
    speaking: "New Practice",
  }[type];
  const Icon = { coach: MessageSquare, writing: PenLine, speaking: Mic }[type];

  // ── Collapsed view ────────────────────────────────────────────────────────
  if (sidebarCollapsed) {
    return (
      <aside className="hidden lg:flex w-14 flex-col items-center border-r border-slate-200 bg-white py-3 gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebarCollapse}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNew}
          title={newLabel}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="w-8 border-t border-slate-200" />
        {items.slice(0, 6).map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              activeConversationId === item.id &&
                "bg-indigo-50 text-indigo-700",
            )}
            onClick={() => handleItemClick(item)}
            title={item.title}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </aside>
    );
  }

  // ── Expanded view ─────────────────────────────────────────────────────────
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-200">
        <Button
          variant="outline"
          className="flex-1 justify-start gap-2 h-9 text-sm"
          onClick={handleNew}
        >
          <Plus className="h-4 w-4" />
          {newLabel}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={toggleSidebarCollapse}
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* History list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {groups.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">
              No history yet
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-slate-400 px-2 py-1 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    isActive={
                      activeConversationId === item.id || pathname === item.href
                    }
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          {items.length} {items.length === 1 ? "session" : "sessions"}
        </p>
      </div>
    </aside>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

interface HistoryItemProps {
  item: { id: string; title: string; date: Date; badge?: string };
  isActive: boolean;
  onClick: () => void;
}

function HistoryItem({ item, isActive, onClick }: HistoryItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors",
        isActive ? "bg-indigo-50" : "hover:bg-slate-100",
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            isActive ? "text-indigo-700 font-medium" : "text-slate-800",
          )}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">
            {relativeDate(item.date)}
          </span>
          {item.badge && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs h-4 px-1 py-0",
                parseFloat(item.badge) >= 7.5 || parseFloat(item.badge) >= 75
                  ? "text-emerald-600 border-emerald-200"
                  : "text-amber-600 border-amber-200",
              )}
            >
              {item.badge}
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
              isActive && "opacity-100",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
