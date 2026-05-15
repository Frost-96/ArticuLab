"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    type FormEvent,
    useMemo,
    useState,
    useSyncExternalStore,
    useTransition,
} from "react";
import {
    Loader2,
    MessageSquare,
    Mic,
    MoreHorizontal,
    PanelLeft,
    Pencil,
    PenLine,
    Pin,
    PinOff,
    Plus,
    SquarePen,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import {
    deleteConversationAction,
    updateConversationTitleAction,
} from "@/server/actions/conversation.action";
import { deleteSpeakingExerciseAction } from "@/server/actions/speaking.action";
import {
    deleteWritingExerciseAction,
    renameWritingExerciseAction,
} from "@/server/actions/writing.action";
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
                accent: "bg-sky-600",
                accentText: "text-sky-700",
                activeRail: "bg-sky-500",
                ring: "ring-sky-100",
                soft: "bg-sky-50 text-sky-700",
                active: "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80",
                hover: "hover:bg-slate-200/70",
                badge: "border-sky-200 bg-white text-sky-700",
                title: "Writing Studio",
            };
        case "speaking":
            return {
                accent: "bg-blue-600",
                accentText: "text-blue-700",
                activeRail: "bg-blue-500",
                ring: "ring-blue-100",
                soft: "bg-blue-50 text-blue-700",
                active: "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80",
                hover: "hover:bg-slate-200/70",
                badge: "border-blue-200 bg-white text-blue-700",
                title: "Speaking Lab",
            };
        case "coach":
            return {
                accent: "bg-slate-900",
                accentText: "text-slate-700",
                activeRail: "bg-slate-700",
                ring: "ring-teal-100",
                soft: "bg-teal-50 text-teal-700",
                active: "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80",
                hover: "hover:bg-slate-200/70",
                badge: "border-teal-200 bg-white text-teal-700",
                title: "Coach Archive",
            };
    }
}

const META_BADGE_STYLES = [
    "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
];

const PINNED_SIDEBAR_EVENT = "articulab-sidebar-pinned-change";

function readPinnedSnapshot(storageKey: string) {
    if (typeof window === "undefined") {
        return "[]";
    }

    try {
        return window.localStorage.getItem(storageKey) ?? "[]";
    } catch {
        return "[]";
    }
}

function parsePinnedIds(snapshot: string) {
    try {
        const parsedPinnedIds = JSON.parse(snapshot);

        if (!Array.isArray(parsedPinnedIds)) {
            return [];
        }

        return parsedPinnedIds.filter(
            (value): value is string => typeof value === "string",
        );
    } catch {
        return [];
    }
}

function subscribeToPinnedIds(onStoreChange: () => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    window.addEventListener("storage", onStoreChange);
    window.addEventListener(PINNED_SIDEBAR_EVENT, onStoreChange);

    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(PINNED_SIDEBAR_EVENT, onStoreChange);
    };
}

export function LeftSidebar({ type, items }: LeftSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [mutatingId, setMutatingId] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] =
        useState<SidebarHistoryItem | null>(null);
    const [renameTitle, setRenameTitle] = useState("");
    const [deleteTarget, setDeleteTarget] =
        useState<SidebarHistoryItem | null>(null);
    const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

    const query = searchParams.toString();
    const currentHref = query ? `${pathname}?${query}` : pathname;
    const theme = getSidebarTheme(type);
    const pinnedStorageKey = `articulab.sidebar.${type}.pinned`;
    const pinnedSnapshot = useSyncExternalStore(
        subscribeToPinnedIds,
        () => readPinnedSnapshot(pinnedStorageKey),
        () => "[]",
    );
    const pinnedIds = useMemo(
        () => parsePinnedIds(pinnedSnapshot),
        [pinnedSnapshot],
    );
    const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
    const orderedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            const aPinned = pinnedIdSet.has(a.id);
            const bPinned = pinnedIdSet.has(b.id);

            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1;
            }

            return items.indexOf(a) - items.indexOf(b);
        });
    }, [items, pinnedIdSet]);
    const groups = useMemo(() => {
        const pinnedItems = orderedItems.filter((item) => pinnedIdSet.has(item.id));
        const unpinnedItems = orderedItems.filter(
            (item) => !pinnedIdSet.has(item.id),
        );

        return [
            pinnedItems.length > 0
                ? { label: "Pinned", items: pinnedItems }
                : null,
            ...groupByDay(unpinnedItems),
        ].filter(
            (group): group is { label: string; items: SidebarHistoryItem[] } =>
                group !== null,
        );
    }, [orderedItems, pinnedIdSet]);

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
    const recentItems = orderedItems.slice(0, 6);
    const hasActiveRecentItem = recentItems.some((item) => currentHref === item.href);
    const collapsedRecentLabel = "\u6700\u8fd1\u804a\u5929";

    function togglePinnedItem(item: SidebarHistoryItem) {
        const next = pinnedIds.includes(item.id)
            ? pinnedIds.filter((id) => id !== item.id)
            : [item.id, ...pinnedIds];

        try {
            window.localStorage.setItem(pinnedStorageKey, JSON.stringify(next));
            window.dispatchEvent(new Event(PINNED_SIDEBAR_EVENT));
        } catch {
            window.dispatchEvent(new Event(PINNED_SIDEBAR_EVENT));
        }
    }

    function getRenameConversationId(item: SidebarHistoryItem) {
        if (item.conversationId) {
            return item.conversationId;
        }

        if (type === "coach") {
            return item.id;
        }

        return null;
    }

    function canRenameItem(item: SidebarHistoryItem) {
        return type === "writing" || getRenameConversationId(item) !== null;
    }

    function openRenameDialog(item: SidebarHistoryItem) {
        if (!canRenameItem(item)) {
            return;
        }

        setRenameTarget(item);
        setRenameTitle(item.title);
    }

    function submitRename(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!renameTarget) {
            return;
        }

        const item = renameTarget;
        const conversationId = getRenameConversationId(item);
        if (type !== "writing" && !conversationId) {
            return;
        }

        const nextTitle = renameTitle.trim();
        if (!nextTitle || nextTitle === item.title) {
            setRenameTarget(null);
            return;
        }

        setMutatingId(item.id);
        startTransition(() => {
            void (async () => {
                const result =
                    type === "writing"
                        ? await renameWritingExerciseAction({
                              exerciseId: item.id,
                              title: nextTitle.trim(),
                          })
                        : await updateConversationTitleAction({
                              id: conversationId!,
                              title: nextTitle.trim(),
                          });

                setMutatingId(null);

                if (!result.success) {
                    window.alert(result.error);
                    return;
                }

                setRenameTarget(null);
                setRenameTitle("");
                router.refresh();
            })();
        });
    }

    function openDeleteDialog(item: SidebarHistoryItem) {
        setDeleteTarget(item);
    }

    function confirmDeleteItem() {
        if (!deleteTarget) {
            return;
        }

        const item = deleteTarget;
        setMutatingId(item.id);
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

                setMutatingId(null);

                if (!result.success) {
                    window.alert(result.error);
                    return;
                }

                setDeleteTarget(null);
                if (currentHref === item.href) {
                    router.push(newHref);
                }
                router.refresh();
            })();
        });
    }

    if (sidebarCollapsed) {
        return (
            <aside className="relative hidden w-14 shrink-0 flex-col items-center gap-2 border-r border-slate-200/70 bg-slate-100/90 px-1.5 py-2 transition-[width] duration-200 ease-out lg:flex">
                <Button
                    variant="ghost"
                    size="icon"
                    className="group h-9 w-9 rounded-xl text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-950"
                    onClick={toggleSidebarCollapse}
                    title="\u6253\u5f00\u8fb9\u680f"
                >
                    <Icon
                        className={cn(
                            "h-4 w-4 group-hover:hidden",
                            theme.accentText,
                        )}
                    />
                    <PanelLeft className="hidden h-4 w-4 group-hover:block" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-9 w-9 rounded-xl text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-950",
                    )}
                    onClick={() => router.push(newHref)}
                    title={newLabel}
                >
                    <SquarePen className="h-4 w-4" />
                </Button>
                <div className="my-1 h-px w-8 bg-slate-200" />
                <div className="group/recent">
                    <button
                        type="button"
                        title={collapsedRecentLabel}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors",
                            hasActiveRecentItem
                                ? "bg-sky-100 text-sky-700"
                                : "hover:bg-slate-200 hover:text-slate-950",
                        )}
                    >
                        <MessageSquare className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute left-full top-0 z-50 w-80 translate-x-1 pl-2 opacity-0 transition-all duration-150 ease-out group-hover/recent:pointer-events-auto group-hover/recent:translate-x-0 group-hover/recent:opacity-100 group-focus-within/recent:pointer-events-auto group-focus-within/recent:translate-x-0 group-focus-within/recent:opacity-100">
                        <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl ring-1 ring-slate-200/70">
                            <div className="px-2 py-2 text-sm font-semibold text-slate-900">
                                {collapsedRecentLabel}
                            </div>
                            {recentItems.length > 0 ? (
                                <div className="space-y-0.5">
                                    {recentItems.map((item) => {
                                        const active = currentHref === item.href;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => router.push(item.href)}
                                                title={item.title}
                                                className={cn(
                                                    "block w-full truncate rounded-lg px-2 py-2 text-left text-sm leading-5 transition-colors",
                                                    active
                                                        ? "bg-sky-50 text-sky-800"
                                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                                                )}
                                            >
                                                {item.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-lg px-2 py-3 text-sm text-slate-500">
                                    No history yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden h-full w-[304px] shrink-0 border-r border-slate-200/70 bg-slate-100/90 transition-[width] duration-200 ease-out lg:block">
            <ScrollArea className="h-full">
                <div className="p-2">
                    <div className="sidebar-content-enter">
                        <div className="mb-1 flex items-center justify-between gap-2 px-2 py-1.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                                    <Icon className={cn("h-4 w-4", theme.accentText)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {theme.title}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {items.length} saved {items.length === 1 ? "session" : "sessions"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                onClick={toggleSidebarCollapse}
                                title="Collapse sidebar"
                            >
                                <PanelLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            className={cn(
                                "h-9 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200 hover:text-slate-950",
                                theme.ring,
                            )}
                            onClick={() => router.push(newHref)}
                        >
                            <Plus className="h-4 w-4" />
                            {newLabel}
                        </Button>
                    </div>
                </div>

                <div className="sidebar-content-enter space-y-4 px-2 pb-3">
                    {groups.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 text-center">
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
                            <div className="mb-1.5 px-2">
                                <span className="text-xs font-medium text-slate-500">
                                    {group.label}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = currentHref === item.href;
                                    const isPinned = pinnedIdSet.has(item.id);
                                    const canRename = canRenameItem(item);
                                    const isMutating =
                                        isPending && mutatingId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "group/item relative w-full rounded-xl px-2.5 py-2.5 pr-9 text-left transition-colors",
                                                active
                                                    ? theme.active
                                                    : cn("text-slate-700", theme.hover),
                                            )}
                                        >
                                            {active ? (
                                                <div
                                                    className={cn(
                                                        "absolute left-0 top-2.5 h-[calc(100%-20px)] w-0.5 rounded-full",
                                                        theme.activeRail,
                                                    )}
                                                />
                                            ) : null}
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
                                                                    ? "text-slate-950"
                                                                    : "text-slate-700",
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
                                                                        "min-h-5 max-w-full rounded-md border bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                                                                        theme.badge,
                                                                    )}
                                                                >
                                                                    {item.badge}
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        {item.meta?.length ? (
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                {item.meta.map((meta) => (
                                                                    <span
                                                                        key={`${item.id}-${meta}`}
                                                                        className={cn(
                                                                            "rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4",
                                                                            META_BADGE_STYLES[
                                                                                item.meta!.indexOf(meta) %
                                                                                    META_BADGE_STYLES.length
                                                                            ],
                                                                        )}
                                                                    >
                                                                        {meta}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    {isPinned ? (
                                                        <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                "mt-1 h-2 w-2 shrink-0 rounded-full",
                                                                active
                                                                    ? "bg-current opacity-80"
                                                                    : "bg-slate-300",
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="absolute right-1.5 top-2.5 shrink-0 rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white hover:text-slate-700 data-[state=open]:bg-white data-[state=open]:text-slate-700 data-[state=open]:opacity-100 group-hover/item:opacity-100 focus-visible:opacity-100"
                                                        disabled={isMutating}
                                                        title="More actions"
                                                        aria-label={`More actions for ${item.title}`}
                                                    >
                                                        {isMutating ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-36"
                                                >
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            togglePinnedItem(item)
                                                        }
                                                    >
                                                        {isPinned ? (
                                                            <PinOff className="h-4 w-4" />
                                                        ) : (
                                                            <Pin className="h-4 w-4" />
                                                        )}
                                                        {isPinned ? "Unpin" : "Pin to top"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={!canRename}
                                                        onSelect={() =>
                                                            openRenameDialog(item)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            openDeleteDialog(item)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <RenameDialog
                open={renameTarget !== null}
                title={renameTitle}
                itemTitle={renameTarget?.title ?? ""}
                isPending={isPending && mutatingId === renameTarget?.id}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameTarget(null);
                        setRenameTitle("");
                    }
                }}
                onTitleChange={setRenameTitle}
                onSubmit={submitRename}
            />
            <DeleteDialog
                open={deleteTarget !== null}
                title={deleteTarget?.title ?? ""}
                type={type}
                isPending={isPending && mutatingId === deleteTarget?.id}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                onConfirm={confirmDeleteItem}
            />
        </aside>
    );
}

function RenameDialog({
    open,
    title,
    itemTitle,
    isPending,
    onOpenChange,
    onTitleChange,
    onSubmit,
}: {
    open: boolean;
    title: string;
    itemTitle: string;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onTitleChange: (title: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Rename</DialogTitle>
                        <DialogDescription>
                            Update the title shown in the sidebar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="sidebar-rename-title">Title</Label>
                        <Input
                            id="sidebar-rename-title"
                            value={title}
                            onChange={(event) => onTitleChange(event.target.value)}
                            placeholder={itemTitle || "Untitled"}
                            autoFocus
                            disabled={isPending}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim() || isPending}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteDialog({
    open,
    title,
    type,
    isPending,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    title: string;
    type: SidebarType;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    const noun =
        type === "coach"
            ? "conversation"
            : type === "writing"
              ? "writing session"
              : "speaking session";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete {noun}?</DialogTitle>
                    <DialogDescription>
                        This will remove <span className="font-medium">{title || "Untitled"}</span> from your
                        history. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting
                            </>
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
