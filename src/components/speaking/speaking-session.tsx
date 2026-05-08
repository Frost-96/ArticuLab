"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Mic,
    Pause,
    Play,
    Send,
    Square,
    Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    endSpeakingAction,
    sendSpeakingMessageAction,
} from "@/server/actions/speaking.action";
import { cn } from "@/lib/utils";
import type { SpeakingExerciseDetail, SpeakingMessage } from "@/types/speaking/speakingTypes";

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
    const [messages, setMessages] = useState<SpeakingMessage[]>(exercise.messages);
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [totalTurns, setTotalTurns] = useState(exercise.totalTurns);
    const [isSending, setIsSending] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const readOnly = exercise.status !== "in_progress";

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
        <div className="flex min-h-full flex-col bg-slate-50">
            <header className="border-b border-slate-200 bg-white px-6 py-3">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/speaking">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="font-medium text-slate-900">{exercise.title}</h1>
                            <p className="text-xs text-slate-400">
                                {exercise.aiRole} | {exercise.scenarioType}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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

            <main className="flex-1 overflow-auto p-6">
                <div className="mx-auto max-w-5xl space-y-4">
                    <Card className="border-violet-100 bg-white">
                        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-900">
                                    {exercise.description || exercise.prompt || exercise.title}
                                </p>
                                {exercise.prompt ? (
                                    <p className="text-sm leading-6 text-slate-500">
                                        Prompt: {exercise.prompt}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>{totalTurns} turns</span>
                                <span>{formatDuration(exercise.durationSeconds)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {error ? (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4 text-sm text-red-700">
                                {error}
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="space-y-4">
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === "user" && "flex-row-reverse",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                                            message.role === "assistant"
                                                ? "bg-violet-100 text-violet-700"
                                                : "bg-emerald-100 text-emerald-700",
                                        )}
                                    >
                                        {message.role === "assistant" ? "AI" : "You"}
                                    </div>
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                                            message.role === "assistant"
                                                ? "border border-slate-200 bg-white text-slate-700"
                                                : "bg-indigo-600 text-white",
                                        )}
                                    >
                                        <p>{message.content}</p>
                                        {message.role === "assistant" ? (
                                            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 gap-1 px-2 text-xs text-violet-700"
                                                    disabled={!message.audioUrl}
                                                >
                                                    <Volume2 className="h-3.5 w-3.5" />
                                                    Audio
                                                </Button>
                                                <span className="text-xs text-slate-400">
                                                    AI response
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="p-6 text-sm text-slate-500">
                                    No transcript yet. Start recording or type a response to
                                    begin the conversation.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-200 bg-white p-4">
                <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <button
                            type="button"
                            disabled={readOnly || isSending || isFinishing}
                            onClick={() => setIsRecording((value) => !value)}
                            className={cn(
                                "relative flex h-20 w-20 items-center justify-center rounded-full border text-white shadow-sm transition-all",
                                isRecording
                                    ? "border-red-300 bg-red-500"
                                    : "border-violet-300 bg-violet-600 hover:bg-violet-700",
                                (readOnly || isSending || isFinishing) &&
                                    "cursor-not-allowed opacity-60",
                            )}
                        >
                            {isRecording ? (
                                <>
                                    <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
                                    <Pause className="relative h-7 w-7" />
                                </>
                            ) : (
                                <Mic className="h-8 w-8" />
                            )}
                        </button>
                        <p className="mt-3 text-sm font-medium text-slate-900">
                            {isRecording ? "Recording" : "Tap to speak"}
                        </p>
                        <div className="mt-2 flex h-6 items-end gap-1">
                            {[10, 18, 26, 14, 22].map((height, index) => (
                                <span
                                    key={`${height}-${index}`}
                                    className={cn(
                                        "w-1.5 rounded-full bg-violet-300",
                                        isRecording && "animate-pulse bg-red-300",
                                    )}
                                    style={{ height }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                                Live transcript
                            </p>
                            <p className="text-xs text-slate-400">
                                {totalTurns} turns · {formatDuration(exercise.durationSeconds)}
                            </p>
                        </div>
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
                            className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2 lg:w-32"
                            disabled={readOnly || isSending || isFinishing}
                            onClick={() => setIsRecording((value) => !value)}
                        >
                            {isRecording ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            {isRecording ? "Pause" : "Record"}
                        </Button>
                        <Button
                            className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 lg:w-32"
                            disabled={!input.trim() || readOnly || isSending || isFinishing}
                            onClick={() => void handleSend()}
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
