"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
    MessageSquare,
    Mic,
    Pencil,
    Send,
    Sparkles,
    Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    createConversationAction,
    deleteConversationAction,
    saveMessageAction,
    updateConversationTitleAction,
} from "@/server/actions/conversation.action";
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
    const pieces = content.split(/(He goes|He went|verb form|thesis|topic sentences|vocabulary upgrade)/gi);

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

export function CoachHistoryPage({ data }: CoachHistoryPageProps) {
    const router = useRouter();
    const activeConversationId = data.activeConversation?.id ?? null;
    const [draft, setDraft] = useState("");
    const [isComposing, setIsComposing] = useState(false);
    const [isMutatingConversation, startConversationTransition] =
        useTransition();
    const [localMessages, setLocalMessages] = useState<LocalCoachMessage[]>([]);
    const messages = useMemo(
        () => [
            ...(data.activeConversation?.messages ?? []),
            ...localMessages,
        ],
        [data.activeConversation?.messages, localMessages],
    );

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

    function handleRenameConversation(conversationId: string, title: string) {
        const nextTitle = window.prompt("Rename conversation", title);
        if (!nextTitle?.trim()) {
            return;
        }

        startConversationTransition(() => {
            void (async () => {
                const result = await updateConversationTitleAction({
                    id: conversationId,
                    title: nextTitle.trim(),
                });

                if (!result.success) {
                    window.alert(result.error);
                    return;
                }

                router.refresh();
            })();
        });
    }

    function handleDeleteConversation(conversationId: string, title: string) {
        const confirmed = window.confirm(`Delete "${title}"?`);
        if (!confirmed) {
            return;
        }

        startConversationTransition(() => {
            void (async () => {
                const result = await deleteConversationAction({
                    id: conversationId,
                });

                if (!result.success) {
                    window.alert(result.error);
                    return;
                }

                router.push("/coach");
                router.refresh();
            })();
        });
    }

    if (data.conversations.length === 0) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 p-6">
                <Card className="w-full max-w-2xl border-slate-200 shadow-sm">
                    <CardContent className="space-y-6 p-8">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                            <Sparkles className="h-6 w-6 text-indigo-700" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-semibold text-slate-900">
                                Start with your AI writing coach
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Ask for a grammar check, a clearer sentence, or a quick
                                IELTS-style explanation.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {[
                                "Check this sentence",
                                "Improve my essay tone",
                                "Explain this grammar point",
                            ].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setDraft(item)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                        {localMessages.length > 0 ? (
                            <div className="max-h-64 space-y-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                                {localMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                                            message.role === "assistant"
                                                ? "border border-slate-200 bg-white text-slate-700"
                                                : "ml-auto bg-indigo-600 text-white"
                                        }`}
                                    >
                                        {message.role === "assistant" ? (
                                            <HighlightedCoachText content={message.content} />
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2">
                            <Textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Ask your coach anything about English..."
                                className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm focus-visible:ring-0"
                                rows={1}
                            />
                            <Button variant="outline" size="icon">
                                <Mic className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => void handleSend()}
                                disabled={!draft.trim() || isComposing}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-slate-50">
                <div className="border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-medium text-slate-900">
                                {data.activeConversation?.title ?? "Conversation"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {data.activeConversation
                                    ? `${data.activeConversation.messages.length} messages`
                                    : "No active conversation"}
                            </p>
                        </div>
                        {data.activeConversation ? (
                            <div className="ml-auto flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isMutatingConversation}
                                    onClick={() =>
                                        handleRenameConversation(
                                            data.activeConversation!.id,
                                            data.activeConversation!.title,
                                        )
                                    }
                                >
                                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                    Rename
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    disabled={isMutatingConversation}
                                    onClick={() =>
                                        handleDeleteConversation(
                                            data.activeConversation!.id,
                                            data.activeConversation!.title,
                                        )
                                    }
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-4xl space-y-4">
                        {messages.length ? (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${
                                        message.role === "user" ? "flex-row-reverse" : ""
                                    }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                                            message.role === "assistant"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-900 text-white"
                                        }`}
                                    >
                                        {message.role === "assistant" ? "AI" : "You"}
                                    </div>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                                            message.role === "assistant"
                                                ? "border border-slate-200 bg-white/95 text-slate-700"
                                                : "bg-emerald-600 text-white"
                                        }`}
                                    >
                                        {message.role === "assistant" ? (
                                            <HighlightedCoachText content={message.content} />
                                        ) : (
                                            <p className="whitespace-pre-wrap">
                                                {message.content}
                                            </p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                                            {"pending" in message && message.pending ? (
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
                            ))
                        ) : (
                            <Card className="border-dashed shadow-sm">
                                <CardContent className="p-6 text-sm text-slate-500">
                                    This conversation is ready for your first question.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                    <div className="mx-auto max-w-4xl space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {[
                                "Highlight my grammar mistakes",
                                "Make this sentence more academic",
                                "Explain why this sounds unnatural",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setDraft(suggestion)}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <Textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder="Ask for feedback, a rewrite, or a grammar explanation..."
                                className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm focus-visible:ring-0"
                                rows={1}
                            />
                            <Button variant="outline" size="icon">
                                <Mic className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => void handleSend()}
                                disabled={!draft.trim() || isComposing}
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
        </div>
    );
}
