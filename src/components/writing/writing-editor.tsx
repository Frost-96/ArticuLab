"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Clock,
    FileText,
    Pause,
    Play,
    RotateCcw,
    Save,
    Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
    completeWritingExerciseAction,
    saveDraftAction,
} from "@/server/actions/writing.action";
import type { WritingExerciseDetail } from "@/types/writing/writingTypes";

type WritingEditorProps = {
    exercise: WritingExerciseDetail;
};

const writingStopwatchEventName = "articulab-writing-stopwatch";
const writingStopwatchStoragePrefix = "articulab:writing-stopwatch:";

type WritingStopwatchState = {
    elapsedSeconds: number;
    isRunning: boolean;
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatStopwatchTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return [hours, minutes, seconds]
            .map((unit) => String(unit).padStart(2, "0"))
            .join(":");
    }

    return [minutes, seconds]
        .map((unit) => String(unit).padStart(2, "0"))
        .join(":");
}

function getStopwatchStorageKey(exerciseId: string) {
    return `${writingStopwatchStoragePrefix}${exerciseId}`;
}

function encodeStopwatchState(state: WritingStopwatchState) {
    return JSON.stringify(state);
}

function decodeStopwatchState(value: string): WritingStopwatchState {
    try {
        const parsed = JSON.parse(value) as Partial<WritingStopwatchState>;
        return {
            elapsedSeconds:
                typeof parsed.elapsedSeconds === "number" &&
                    Number.isFinite(parsed.elapsedSeconds)
                    ? Math.max(0, Math.floor(parsed.elapsedSeconds))
                    : 0,
            isRunning: Boolean(parsed.isRunning),
        };
    } catch {
        return { elapsedSeconds: 0, isRunning: false };
    }
}

function readStopwatchSnapshot(exerciseId: string, readOnly: boolean) {
    if (typeof window === "undefined") {
        return encodeStopwatchState({ elapsedSeconds: 0, isRunning: false });
    }

    const storedValue = window.localStorage.getItem(
        getStopwatchStorageKey(exerciseId),
    );

    if (!storedValue) {
        return encodeStopwatchState({
            elapsedSeconds: 0,
            isRunning: !readOnly,
        });
    }

    const storedState = decodeStopwatchState(storedValue);
    return encodeStopwatchState({
        elapsedSeconds: storedState.elapsedSeconds,
        isRunning: readOnly ? false : storedState.isRunning,
    });
}

function writeStopwatchSnapshot(exerciseId: string, state: WritingStopwatchState) {
    if (typeof window === "undefined") {
        return;
    }

    const key = getStopwatchStorageKey(exerciseId);
    window.localStorage.setItem(key, encodeStopwatchState(state));
    window.dispatchEvent(
        new CustomEvent(writingStopwatchEventName, { detail: { key } }),
    );
}

function subscribeToStopwatch(exerciseId: string, onStoreChange: () => void) {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const key = getStopwatchStorageKey(exerciseId);

    const handleStorage = (event: StorageEvent) => {
        if (event.key === key) {
            onStoreChange();
        }
    };

    const handleLocalChange = (event: Event) => {
        if (
            event instanceof CustomEvent &&
            (event.detail as { key?: string } | undefined)?.key === key
        ) {
            onStoreChange();
        }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(writingStopwatchEventName, handleLocalChange);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(writingStopwatchEventName, handleLocalChange);
    };
}

function WritingStopwatch({
    exerciseId,
    readOnly,
}: {
    exerciseId: string;
    readOnly: boolean;
}) {
    const isStableMountRef = useRef(false);
    const snapshot = useSyncExternalStore(
        useCallback(
            (onStoreChange) => subscribeToStopwatch(exerciseId, onStoreChange),
            [exerciseId],
        ),
        useCallback(
            () => readStopwatchSnapshot(exerciseId, readOnly),
            [exerciseId, readOnly],
        ),
        () => encodeStopwatchState({ elapsedSeconds: 0, isRunning: false }),
    );
    const stopwatchState = useMemo(
        () => decodeStopwatchState(snapshot),
        [snapshot],
    );
    const { elapsedSeconds, isRunning } = stopwatchState;

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const timer = window.setInterval(() => {
            writeStopwatchSnapshot(exerciseId, {
                elapsedSeconds:
                    decodeStopwatchState(
                        readStopwatchSnapshot(exerciseId, readOnly),
                    ).elapsedSeconds + 1,
                isRunning: true,
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [exerciseId, isRunning, readOnly]);

    useEffect(() => {
        const mountTimer = window.setTimeout(() => {
            isStableMountRef.current = true;
        }, 0);

        const pauseStopwatch = () => {
            const current = decodeStopwatchState(
                readStopwatchSnapshot(exerciseId, readOnly),
            );
            writeStopwatchSnapshot(exerciseId, {
                elapsedSeconds: current.elapsedSeconds,
                isRunning: false,
            });
        };

        window.addEventListener("pagehide", pauseStopwatch);

        return () => {
            window.clearTimeout(mountTimer);
            window.removeEventListener("pagehide", pauseStopwatch);
            if (!isStableMountRef.current) {
                return;
            }

            pauseStopwatch();
        };
    }, [exerciseId, readOnly]);

    return (
        <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-white px-2.5 py-1 text-slate-600 shadow-sm">
            <Timer className="h-3.5 w-3.5 text-sky-600" />
            <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatStopwatchTime(elapsedSeconds)}
            </span>
            {!readOnly ? (
                <div className="ml-1 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() =>
                            writeStopwatchSnapshot(exerciseId, {
                                elapsedSeconds,
                                isRunning: !isRunning,
                            })
                        }
                        className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-700"
                        aria-label={isRunning ? "Pause stopwatch" : "Start stopwatch"}
                    >
                        {isRunning ? (
                            <Pause className="h-3.5 w-3.5" />
                        ) : (
                            <Play className="h-3.5 w-3.5" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            writeStopwatchSnapshot(exerciseId, {
                                elapsedSeconds: 0,
                                isRunning: true,
                            });
                        }}
                        className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-700"
                        aria-label="Reset stopwatch"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export function WritingEditor({ exercise }: WritingEditorProps) {
    const router = useRouter();
    const [content, setContent] = useState(exercise.content);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(exercise.createdAt);
    const [saveLabel, setSaveLabel] = useState("Not saved yet");
    const savedContentRef = useRef(exercise.content);
    const latestContentRef = useRef(exercise.content);
    const readOnly = Boolean(exercise.feedback);

    useEffect(() => {
        latestContentRef.current = content;
    }, [content]);

    const persistDraft = useCallback(async (nextContent: string, silent = false) => {
        if (readOnly) {
            return true;
        }

        if (nextContent === savedContentRef.current) {
            return true;
        }

        setIsSaving(true);
        if (!silent) {
            setSaveLabel("Saving...");
        }
        setSaveError(null);

        const wordCount = nextContent.trim()
            ? nextContent.trim().split(/\s+/).length
            : 0;

        const result = await saveDraftAction({
            exerciseId: exercise.id,
            content: nextContent,
            wordCount,
        });

        setIsSaving(false);

        if (!result.success || !result.data) {
            setSaveError(
                !result.success ? result.error : "Failed to save draft.",
            );
            if (!silent) {
                setSaveLabel("Save failed");
            }
            return false;
        }

        savedContentRef.current = nextContent;
        setLastSavedAt(result.data.draft.lastSavedAt);
        setSaveLabel(silent ? "Auto-saved" : "Saved");
        return true;
    }, [exercise.id, readOnly]);

    useEffect(() => {
        if (readOnly || content === savedContentRef.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            void persistDraft(content, true);
        }, 1500);

        return () => window.clearTimeout(timer);
    }, [content, persistDraft, readOnly]);

    useEffect(() => {
        if (readOnly) {
            return;
        }

        const handleBeforeUnload = () => {
            if (latestContentRef.current !== savedContentRef.current) {
                void persistDraft(latestContentRef.current, true);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            handleBeforeUnload();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [persistDraft, readOnly]);

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const progressValue = Math.min((wordCount / 250) * 100, 100);

    async function handleManualSave() {
        void (await persistDraft(content));
    }

    async function handleComplete() {
        setIsSubmitting(true);
        setSaveError(null);

        const saved = await persistDraft(content);
        if (!saved) {
            setIsSubmitting(false);
            return;
        }

        const result = await completeWritingExerciseAction({
            exerciseId: exercise.id,
        });

        setIsSubmitting(false);

        if (!result.success) {
            setSaveError(result.error);
            return;
        }

        router.push(`/writing/${exercise.id}/review`);
    }

    return (
        <div className="flex min-h-full flex-col bg-slate-50">
            <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/writing">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <Badge variant="outline">{exercise.scenarioType}</Badge>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                        <p>{saveLabel}</p>
                        <p>{formatDateTime(lastSavedAt)}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6">
                <div className="mx-auto max-w-4xl space-y-4">
                    <Card className="border-sky-100 bg-sky-50/50 shadow-sm">
                        <CardContent className="space-y-4 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-100">
                                    <FileText className="h-4 w-4 text-sky-600" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Prompt
                                    </p>
                                    <p className="text-sm leading-6 text-slate-700">
                                        {exercise.prompt}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Created {formatDateTime(exercise.createdAt)}
                                </span>
                                <WritingStopwatch
                                    key={exercise.id}
                                    exerciseId={exercise.id}
                                    readOnly={readOnly}
                                />
                                <span>Status: {exercise.status}</span>
                                {readOnly ? (
                                    <span className="text-emerald-600">
                                        Reviewed content is locked
                                    </span>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    {saveError ? (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4 text-sm text-red-700">
                                {saveError}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="bg-white shadow-sm">
                        <CardContent className="p-0">
                            <Textarea
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                readOnly={readOnly}
                                placeholder="Start writing here..."
                                className="min-h-[520px] resize-none border-0 bg-white p-5 text-base leading-8 focus-visible:ring-0 sm:p-6"
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm text-slate-500">Word Count</p>
                            <p className="font-medium text-slate-900">{wordCount}</p>
                        </div>
                        <div className="w-32">
                            <Progress value={progressValue} className="h-2" />
                            <p className="mt-1 text-xs text-slate-400">Target 250+</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => void handleManualSave()}
                            disabled={readOnly || isSaving || isSubmitting}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Draft
                        </Button>
                        <Button
                            variant={readOnly ? "outline" : "default"}
                            className="bg-sky-600 hover:bg-sky-700"
                            onClick={() =>
                                readOnly
                                    ? router.push(`/writing/${exercise.id}/review`)
                                    : void handleComplete()
                            }
                            disabled={
                                (!readOnly && !content.trim()) || isSaving || isSubmitting
                            }
                        >
                            {readOnly ? "View Review" : "Finish Writing"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
