"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Mic,
    PenLine,
    Plus,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { deleteConversationAction } from "@/server/actions/conversation.action";
import { deleteSpeakingExerciseAction } from "@/server/actions/speaking.action";
import { deleteWritingExerciseAction } from "@/server/actions/writing.action";
import type { SidebarHistoryItem } from "@/types/navigation/sidebarTypes";

export type SidebarType = "coach" | "writing" | "speaking";

type LeftSidebarProps = {
    type: SidebarType;
    items: SidebarHistoryItem[];
};

function getRelativeDate(value: string) {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / 3_600_000);

    if (diffHours < 1) {
        return "Just now";
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
        return "Yesterday";
    }

    return `${diffDays} days ago`;
}

function groupByDay(items: SidebarHistoryItem[]) {
    const now = Date.now();
    const today: SidebarHistoryItem[] = [];
    const yesterday: SidebarHistoryItem[] = [];
    const earlier: SidebarHistoryItem[] = [];

    for (const item of items) {
        const diffHours = (now - new Date(item.date).getTime()) / 3_600_000;

        if (diffHours < 24) {
            today.push(item);
            continue;
        }

        if (diffHours < 48) {
            yesterday.push(item);
            continue;
        }

        earlier.push(item);
    }

    return [
        today.length > 0 ? { label: "Today", items: today } : null,
        yesterday.length > 0 ? { label: "Yesterday", items: yesterday } : null,
        earlier.length > 0 ? { label: "Earlier", items: earlier } : null,
    ].filter(
        (group): group is { label: string; items: SidebarHistoryItem[] } =>
            group !== null,
    );
}

function getSidebarTheme(type: SidebarType) {
    switch (type) {
        case "writing":
            return {
                accent: "from-indigo-500 via-blue-500 to-slate-900",
                ring: "ring-indigo-100",
                soft: "bg-indigo-50 text-indigo-700",
                active:
                    "border-indigo-200 bg-linear-to-r from-indigo-50 to-white text-indigo-900 shadow-sm",
                hover: "hover:border-indigo-100 hover:bg-indigo-50/40",
                badge: "border-indigo-200 bg-white text-indigo-700",
                title: "Writing Studio",
            };
        case "speaking":
            return {
                accent: "from-violet-500 via-sky-500 to-cyan-500",
                ring: "ring-violet-100",
                soft: "bg-violet-50 text-violet-700",
                active:
                    "border-violet-200 bg-linear-to-r from-violet-50 to-white text-violet-900 shadow-sm",
                hover: "hover:border-violet-100 hover:bg-violet-50/40",
                badge: "border-violet-200 bg-white text-violet-700",
                title: "Speaking Lab",
            };
        case "coach":
            return {
                accent: "from-teal-500 via-cyan-500 to-sky-500",
                ring: "ring-teal-100",
                soft: "bg-teal-50 text-teal-700",
                active:
                    "border-teal-200 bg-linear-to-r from-teal-50 to-white text-teal-900 shadow-sm",
                hover: "hover:border-teal-100 hover:bg-teal-50/40",
                badge: "border-teal-200 bg-white text-teal-700",
                title: "Coach Archive",
            };
    }
}

export function LeftSidebar({ type, items }: LeftSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

    const query = searchParams.toString();
    const currentHref = query ? `${pathname}?${query}` : pathname;
    const groups = groupByDay(items);
    const theme = getSidebarTheme(type);

    const newHref = {
        coach: "/coach",
        writing: "/writing",
        speaking: "/speaking",
    }[type];

    const newLabel = {
        coach: "View History",
        writing: "New Essay",
        speaking: "New Practice",
    }[type];

    const Icon = {
        coach: MessageSquare,
        writing: PenLine,
        speaking: Mic,
    }[type];

    function deleteItem(item: SidebarHistoryItem) {
        const confirmed = window.confirm(`Delete "${item.title}"?`);
        if (!confirmed) {
            return;
        }

        setDeletingId(item.id);
        startTransition(() => {
            void (async () => {
                const result =
                    type === "writing"
                        ? await deleteWritingExerciseAction({
                              exerciseId: item.id,
                          })
                        : type === "speaking"
                          ? await deleteSpeakingExerciseAction({
                                id: item.id,
                            })
                          : await deleteConversationAction({
                                id: item.id,
                            });

                setDeletingId(null);

                if (!result.success) {
                    window.alert(result.error);
                    return;
                }

                if (currentHref === item.href) {
                    router.push(newHref);
                }
                router.refresh();
            })();
        });
    }

    if (sidebarCollapsed) {
        return (
            <aside className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-200/80 bg-white/95 px-2 py-3 backdrop-blur lg:flex">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-sm",
                        theme.accent,
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500"
                    onClick={toggleSidebarCollapse}
                    title="Expand sidebar"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-9 w-9 rounded-xl border border-slate-200 text-slate-600",
                        theme.soft,
                    )}
                    onClick={() => router.push(newHref)}
                    title={newLabel}
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <div className="h-px w-8 bg-slate-200" />
                {items.slice(0, 6).map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => router.push(item.href)}
                        title={item.title}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl border text-slate-500 transition-all",
                            currentHref === item.href
                                ? cn("border-transparent text-white", theme.accent)
                                : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
            </aside>
        );
    }

    return (
        <aside className="hidden w-[320px] shrink-0 flex-col border-r border-slate-200/80 bg-linear-to-b from-white to-slate-50/80 lg:flex">
            <div className="border-b border-slate-200/80 p-3">
                <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div
                        className={cn(
                            "absolute inset-x-0 top-0 h-1 bg-linear-to-r",
                            theme.accent,
                        )}
                    />
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div
                                className={cn(
                                    "mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-sm",
                                    theme.accent,
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                                {theme.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {items.length} saved {items.length === 1 ? "session" : "sessions"}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500"
                            onClick={toggleSidebarCollapse}
                            title="Collapse sidebar"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        className={cn(
                            "mt-4 h-10 w-full justify-start gap-2 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 hover:bg-white",
                            theme.ring,
                        )}
                        onClick={() => router.push(newHref)}
                    >
                        <Plus className="h-4 w-4" />
                        {newLabel}
                    </Button>
                </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-5 p-3">
                    {groups.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 p-6 text-center shadow-sm">
                            <p className="text-sm font-medium text-slate-700">
                                No history yet
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                                New sessions will appear here automatically.
                            </p>
                        </div>
                    ) : null}

                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="mb-2 flex items-center gap-2 px-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    {group.label}
                                </span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="space-y-2">
                                {group.items.map((item) => {
                                    const active = currentHref === item.href;

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "group/item relative w-full rounded-2xl border px-3 py-3.5 pr-10 text-left transition-colors",
                                                active
                                                    ? theme.active
                                                    : cn(
                                                          "border-slate-200/80 bg-white shadow-sm",
                                                          theme.hover,
                                                      ),
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => router.push(item.href)}
                                                className="block w-full min-w-0 text-left"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className={cn(
                                                                "line-clamp-2 break-words text-sm font-medium leading-5",
                                                                active
                                                                    ? "text-slate-900"
                                                                    : "text-slate-800",
                                                            )}
                                                        >
                                                            {item.title}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span className="text-xs text-slate-400">
                                                                {getRelativeDate(item.date)}
                                                            </span>
                                                            {item.badge ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "min-h-5 max-w-full rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                                                                        theme.badge,
                                                                    )}
                                                                >
                                                                    {item.badge}
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                                                            active
                                                                ? "bg-current opacity-80"
                                                            : "bg-slate-200",
                                                        )}
                                                    />
                                                </div>
                                            </button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="absolute right-2 top-3 shrink-0 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover/item:opacity-100 focus-visible:opacity-100"
                                                disabled={isPending && deletingId === item.id}
                                                onClick={() => deleteItem(item)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </aside>
    );
}
