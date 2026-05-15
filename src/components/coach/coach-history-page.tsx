"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
    MessageSquarePlus,
    Mic,
    Send,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    createConversationAction,
    saveMessageAction,
} from "@/server/actions/conversation.action";
import { cn } from "@/lib/utils";
import type { CoachPageData } from "@/types/coach/coachTypes";

type CoachHistoryPageProps = {
    data: CoachPageData;
};

type LocalCoachMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    pending?: boolean;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function buildCoachReply(input: string) {
    const trimmed = input.trim();

    if (/he go/i.test(trimmed)) {
        return "Try: He goes for a habit, or He went for a past event. The verb form should match the tense and subject.";
    }

    if (/essay|ielts|toefl|paragraph/i.test(trimmed)) {
        return "A strong next step is to check the thesis, paragraph topic sentences, and examples. I would revise one sentence at a time, then compare the improved version with your original.";
    }

    return "Good prompt. I would first identify one grammar point, one vocabulary upgrade, and one clearer way to express the idea. Share a sentence when you want line-by-line feedback.";
}

function HighlightedCoachText({ content }: { content: string }) {
    const pieces = content.split(
        /(He goes|He went|verb form|thesis|topic sentences|vocabulary upgrade)/gi,
    );

    return (
        <p className="whitespace-pre-wrap">
            {pieces.map((piece, index) => {
                const normalized = piece.toLowerCase();
                const isCorrection =
                    normalized === "he goes" ||
                    normalized === "he went" ||
                    normalized === "verb form";
                const isTip =
                    normalized === "thesis" ||
                    normalized === "topic sentences" ||
                    normalized === "vocabulary upgrade";

                if (!isCorrection && !isTip) {
                    return <span key={`${piece}-${index}`}>{piece}</span>;
                }

                return (
                    <span
                        key={`${piece}-${index}`}
                        className={
                            isCorrection
                                ? "rounded bg-red-50 px-1 font-medium text-red-700"
                                : "rounded bg-blue-50 px-1 font-medium text-blue-700"
                        }
                    >
                        {piece}
                    </span>
                );
            })}
        </p>
    );
}

function CoachMessageBubble({ message }: { message: LocalCoachMessage }) {
    const isAssistant = message.role === "assistant";

    return (
        <div
            className={cn(
                "flex w-full",
                isAssistant ? "justify-start" : "justify-end",
            )}
        >
            <div
                className={cn(
                    "max-w-[86%] text-sm leading-7 sm:max-w-[75%]",
                    isAssistant
                        ? "text-slate-800"
                        : "rounded-3xl bg-slate-100 px-4 py-2.5 text-slate-900",
                )}
            >
                {isAssistant ? (
                    <HighlightedCoachText content={message.content} />
                ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <div
                    className={cn(
                        "mt-2 flex items-center gap-2 text-xs text-slate-400",
                        !isAssistant && "justify-end",
                    )}
                >
                    {message.pending ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Thinking
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            {formatDate(message.createdAt)}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function CoachHistoryPage({ data }: CoachHistoryPageProps) {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const activeConversationId = data.activeConversation?.id ?? null;
    const [draft, setDraft] = useState("");
    const [isComposing, setIsComposing] = useState(false);
    const [localMessages, setLocalMessages] = useState<LocalCoachMessage[]>([]);
    const messages = useMemo(
        () => [
            ...(data.activeConversation?.messages ?? []),
            ...localMessages,
        ],
        [data.activeConversation?.messages, localMessages],
    );
    const latestMessageId = messages[messages.length - 1]?.id;
    const quickPrompts = [
        "Highlight my grammar mistakes",
        "Make this sentence more academic",
        "Explain why this sounds unnatural",
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [latestMessageId]);

    async function handleSend() {
        const content = draft.trim();
        if (!content || isComposing) {
            return;
        }

        const now = new Date().toISOString();
        const userMessage: LocalCoachMessage = {
            id: `local-user-${now}`,
            role: "user",
            content,
            createdAt: now,
        };
        const assistantMessage: LocalCoachMessage = {
            id: `local-ai-${now}`,
            role: "assistant",
            content: buildCoachReply(content),
            createdAt: now,
            pending: true,
        };

        setDraft("");
        setIsComposing(true);
        setLocalMessages((current) => [...current, userMessage, assistantMessage]);

        const conversationId = await resolveConversationId(content);
        if (!conversationId) {
            setLocalMessages((current) =>
                current.filter(
                    (message) =>
                        message.id !== userMessage.id &&
                        message.id !== assistantMessage.id,
                ),
            );
            setIsComposing(false);
            return;
        }

        const savedUser = await saveMessageAction({
            conversationId,
            role: "user",
            content,
        });
        if (!savedUser.success) {
            window.alert(savedUser.error);
            setIsComposing(false);
            return;
        }

        const savedAssistant = await saveMessageAction({
            conversationId,
            role: "assistant",
            content: assistantMessage.content,
        });
        if (!savedAssistant.success) {
            window.alert(savedAssistant.error);
            setIsComposing(false);
            return;
        }

        setLocalMessages((current) =>
            current.map((message) =>
                message.id === assistantMessage.id
                    ? { ...message, pending: false }
                    : message,
            ),
        );
        setIsComposing(false);

        if (!activeConversationId) {
            router.push(`/coach?id=${conversationId}`);
        }
        router.refresh();
    }

    async function resolveConversationId(firstMessage: string) {
        if (activeConversationId) {
            return activeConversationId;
        }

        const title =
            firstMessage.length > 80
                ? `${firstMessage.slice(0, 77).trim()}...`
                : firstMessage;
        const result = await createConversationAction({
            type: "coach",
            title,
        });

        if (!result.success) {
            window.alert(result.error);
            return null;
        }

        return result.data.conversation.id;
    }

    return (
        <TooltipProvider>
            <div className="flex h-full flex-col bg-white">
                <main className="flex-1 overflow-auto">
                    <div className="mx-auto flex min-h-full max-w-4xl flex-col px-4 py-6 sm:px-6">
                        {messages.length ? (
                            <div className="flex-1 space-y-7 pb-6">
                                {messages.map((message) => (
                                    <CoachMessageBubble
                                        key={message.id}
                                        message={message}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center py-8">
                                <div className="w-full max-w-2xl text-center">
                                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
                                        {data.conversations.length === 0 ? (
                                            <Sparkles className="h-6 w-6" />
                                        ) : (
                                            <MessageSquarePlus className="h-6 w-6" />
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-semibold text-slate-950">
                                        How can I help with your English today?
                                    </h1>
                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Ask for grammar feedback, a rewrite, pronunciation
                                        phrasing, or a quick explanation.
                                    </p>
                                    <div className="mt-6 grid gap-2 sm:grid-cols-3">
                                        {quickPrompts.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setDraft(item)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm leading-5 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="shrink-0 bg-white px-3 pb-4 sm:px-4">
                    <div className="mx-auto max-w-4xl">
                        {messages.length ? (
                            <div className="mb-2 flex flex-wrap gap-2 px-1">
                                {quickPrompts.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setDraft(suggestion)}
                                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                            <div className="flex items-end gap-2">
                                <Textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            void handleSend();
                                        }
                                    }}
                                    placeholder="Message your coach..."
                                    className="max-h-36 min-h-11 resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-6 shadow-none focus-visible:ring-0"
                                    rows={1}
                                />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-11 w-11 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                            aria-label="Voice input"
                                        >
                                            <Mic className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Voice input</TooltipContent>
                                </Tooltip>
                                <Button
                                    size="icon"
                                    className="h-11 w-11 rounded-full bg-teal-600 text-white hover:bg-teal-700"
                                    onClick={() => void handleSend()}
                                    disabled={!draft.trim() || isComposing}
                                    aria-label="Send message"
                                >
                                    {isComposing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </TooltipProvider>
    );
}
