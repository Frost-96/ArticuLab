"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Mic,
    Pause,
    Send,
    Square,
    Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    endSpeakingAction,
    sendSpeakingMessageAction,
} from "@/server/actions/speaking.action";
import { cn } from "@/lib/utils";
import type {
    SpeakingExerciseDetail,
    SpeakingMessage,
} from "@/types/speaking/speakingTypes";

type SpeakingSessionProps = {
    exercise: SpeakingExerciseDetail;
};

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function SpeakingSession({ exercise }: SpeakingSessionProps) {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<SpeakingMessage[]>(exercise.messages);
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [totalTurns, setTotalTurns] = useState(exercise.totalTurns);
    const [isSending, setIsSending] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const readOnly = exercise.status !== "in_progress";
    const latestMessageId = messages[messages.length - 1]?.id;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [latestMessageId]);

    async function handleSend() {
        if (!input.trim() || readOnly) {
            return;
        }

        setIsSending(true);
        setError(null);

        const result = await sendSpeakingMessageAction({
            exerciseId: exercise.id,
            conversationId: exercise.conversationId,
            message: input.trim(),
        });

        setIsSending(false);

        if (!result.success || !result.data) {
            setError(
                !result.success ? result.error : "Failed to save message.",
            );
            return;
        }

        setMessages((current) => [...current, result.data!.message]);
        setTotalTurns(result.data.totalTurns);
        setInput("");
        setIsRecording(false);
        startTransition(() => router.refresh());
    }

    async function handleFinish() {
        setIsFinishing(true);
        setError(null);

        const result = await endSpeakingAction({
            exerciseId: exercise.id,
        });

        setIsFinishing(false);

        if (!result.success) {
            setError(result.error);
            return;
        }

        router.push(`/speaking/${exercise.id}/review`);
    }

    return (
        <div className="flex h-full min-h-full flex-col bg-white">
            <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/speaking">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate font-medium text-slate-900">
                                {exercise.title}
                            </h1>
                            <p className="truncate text-xs text-slate-400">
                                {exercise.aiRole} | {exercise.scenarioType}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary">{exercise.status}</Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            disabled={isFinishing}
                            onClick={() => void handleFinish()}
                        >
                            <Square className="mr-2 h-3.5 w-3.5 fill-current" />
                            Finish
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="mx-auto flex min-h-full max-w-4xl flex-col px-4 py-6 sm:px-6">
                    <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900">
                                    {exercise.description || exercise.prompt || exercise.title}
                                </p>
                                {exercise.prompt ? (
                                    <p className="text-sm leading-6 text-slate-500">
                                        Prompt: {exercise.prompt}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                                <span>{totalTurns} turns</span>
                                <span>{formatDuration(exercise.durationSeconds)}</span>
                            </div>
                        </div>
                    </section>

                    {error ? (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex-1 space-y-7 pb-6">
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex w-full",
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[86%] text-sm leading-7 sm:max-w-[75%]",
                                            message.role === "assistant"
                                                ? "text-slate-800"
                                                : "rounded-3xl bg-slate-100 px-4 py-2.5 text-slate-900",
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                        {message.role === "assistant" ? (
                                            <div className="mt-3 flex items-center gap-2 text-slate-500">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1 rounded-full px-2 text-xs text-slate-600 hover:text-slate-900"
                                                    disabled={!message.audioUrl}
                                                >
                                                    <Volume2 className="h-3.5 w-3.5" />
                                                    Audio
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="max-w-md text-center text-sm leading-6 text-slate-500">
                                    No transcript yet. Start recording or type a response to
                                    begin the conversation.
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-white px-3 pb-4 sm:px-4">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                disabled={readOnly || isSending || isFinishing}
                                onClick={() => setIsRecording((value) => !value)}
                                className={cn(
                                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-white transition-all",
                                    isRecording
                                        ? "border-red-300 bg-red-500"
                                        : "border-blue-600 bg-blue-600 hover:bg-blue-700",
                                    (readOnly || isSending || isFinishing) &&
                                        "cursor-not-allowed opacity-60",
                                )}
                                aria-label={
                                    isRecording ? "Pause recording" : "Start recording"
                                }
                            >
                                {isRecording ? (
                                    <>
                                        <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
                                        <Pause className="relative h-5 w-5" />
                                    </>
                                ) : (
                                    <Mic className="h-5 w-5" />
                                )}
                            </button>

                            <textarea
                                value={input}
                                disabled={readOnly || isSending || isFinishing}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder={
                                    readOnly
                                        ? "This completed session is available for review."
                                        : isRecording
                                          ? "Speak now. Your transcript appears here..."
                                          : "Type or record your response..."
                                }
                                className="max-h-36 min-h-11 w-full resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-6 outline-none placeholder:text-slate-400"
                            />

                            <Button
                                size="icon"
                                className="h-11 w-11 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                                disabled={!input.trim() || readOnly || isSending || isFinishing}
                                onClick={() => void handleSend()}
                                aria-label="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-400">
                            <span>{isRecording ? "Recording" : "Ready"}</span>
                            <span>
                                {totalTurns} turns | {formatDuration(exercise.durationSeconds)}
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
