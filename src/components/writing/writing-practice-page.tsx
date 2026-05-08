"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, FileText, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createWritingExerciseAction } from "@/server/actions/writing.action";
import type { WritingScenarioType } from "@/schema";
import type { ScenarioPrompt } from "@/types/scenario/scenarioTypes";
import type { WritingHistoryResult } from "@/types/writing/writingTypes";

type WritingPracticePageProps = {
    scenarios: ScenarioPrompt[];
    history: WritingHistoryResult;
};

const scenarioTypeLabelMap: Record<WritingScenarioType, string> = {
    daily: "Daily",
    ielts_task1: "IELTS Task 1",
    ielts_task2: "IELTS Task 2",
    toefl: "TOEFL",
    cet4: "CET-4",
    cet6: "CET-6",
};

const writingSectionIconClass =
    "flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-sm";

const writingPaperClass =
    "relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(99,102,241,0.06)_32px)] before:bg-[length:100%_32px]";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function SectionHeader({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <div className={writingSectionIconClass}>{icon}</div>
            <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
        </div>
    );
}

export function WritingPracticePage({
    scenarios,
    history,
}: WritingPracticePageProps) {
    const router = useRouter();
    const [customPrompt, setCustomPrompt] = useState("");
    const [customScenarioType, setCustomScenarioType] =
        useState<WritingScenarioType>("daily");
    const [error, setError] = useState<string | null>(null);
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const examScenarioTypes = Array.from(
        new Set(
            scenarios
                .map((scenario) => scenario.category)
                .filter((value): value is WritingScenarioType => value !== "daily"),
        ),
    );

    const dailyScenarios = scenarios.filter(
        (scenario) => scenario.category === "daily",
    );
    const examScenarios = scenarios.filter(
        (scenario) => scenario.category !== "daily",
    );

    async function startExercise(input: {
        key: string;
        scenarioType: WritingScenarioType;
        prompt: string;
        isCustomPrompt: boolean;
        scenarioId?: string | null;
    }) {
        setPendingKey(input.key);
        setError(null);

        const result = await createWritingExerciseAction({
            scenarioType: input.scenarioType,
            prompt: input.prompt,
            isCustomPrompt: input.isCustomPrompt,
            scenarioId: input.scenarioId ?? null,
        });

        if (!result.success || !result.data) {
            setError(
                !result.success
                    ? result.error
                    : "Failed to start writing exercise.",
            );
            setPendingKey(null);
            return;
        }

        router.push(`/writing/${result.data.exercise.id}`);
    }

    return (
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
                <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-2xl">
                            <Badge
                                variant="outline"
                                className="rounded-full border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-indigo-700"
                            >
                                Writing workspace
                            </Badge>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                Start a focused writing session
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                Choose a prompt, write with minimal distraction, then
                                review annotations and concrete rewrites.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[430px]">
                            {[
                                {
                                    label: "Sessions",
                                    value: String(history.summary.totalExercises),
                                    tone: "text-slate-950",
                                    note: "Total practice",
                                },
                                {
                                    label: "Reviewed",
                                    value: String(history.summary.completedExercises),
                                    tone: "text-indigo-700",
                                    note: "Ready for analysis",
                                },
                                {
                                    label: "Average",
                                    value:
                                        history.summary.averageScore?.toFixed(1) ?? "--",
                                    tone: "text-slate-950",
                                    note: "Across reviewed work",
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {item.label}
                                    </p>
                                    <p
                                        className={cn(
                                            "mt-3 text-3xl font-semibold tracking-tight",
                                            item.tone,
                                        )}
                                    >
                                        {item.value}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {item.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {error ? (
                    <Card className="border-red-200 bg-red-50 text-red-700 shadow-sm">
                        <CardContent className="p-4 text-sm">{error}</CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                                <SectionHeader
                                    icon={<PenLine className="h-4 w-4" />}
                                    title="Daily prompts"
                                    description="Low-friction prompts for regular reflection and concise writing practice."
                                />

                                <div className="space-y-3">
                                    {dailyScenarios.length > 0 ? (
                                        dailyScenarios.map((scenario) => (
                                            <button
                                                key={scenario.id}
                                                type="button"
                                                onClick={() =>
                                                    void startExercise({
                                                        key: scenario.id,
                                                        scenarioType:
                                                            scenario.category as WritingScenarioType,
                                                        prompt: scenario.prompt,
                                                        isCustomPrompt: false,
                                                        scenarioId: scenario.id,
                                                    })
                                                }
                                                className={`group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-indigo-200 hover:bg-slate-50 ${writingPaperClass}`}
                                            >
                                                <div className="relative flex items-start justify-between gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge className="rounded-full bg-indigo-600 px-2.5 text-white">
                                                                Daily
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border-slate-200 bg-white px-2.5 text-slate-500"
                                                            >
                                                                {scenario.difficulty}
                                                            </Badge>
                                                        </div>
                                                        <div className="rounded-2xl bg-white/70 p-1">
                                                            <p className="text-base font-semibold text-slate-900">
                                                                {scenario.title}
                                                            </p>
                                                            <p className="mt-2 text-sm leading-7 text-slate-600">
                                                                {scenario.prompt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 rounded-full border border-slate-200 p-2 text-slate-400 transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                                            No daily prompts are available right now.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                                <SectionHeader
                                    icon={<FileText className="h-4 w-4" />}
                                    title="Exam scenarios"
                                    description="Structured tasks with clearer metadata and a stronger task-library feel."
                                />

                                <div className="space-y-3">
                                    {examScenarios.length > 0 ? (
                                        examScenarios.map((scenario) => (
                                            <button
                                                key={scenario.id}
                                                type="button"
                                                onClick={() =>
                                                    void startExercise({
                                                        key: scenario.id,
                                                        scenarioType:
                                                            scenario.category as WritingScenarioType,
                                                        prompt: scenario.prompt,
                                                        isCustomPrompt: false,
                                                        scenarioId: scenario.id,
                                                    })
                                                }
                                                className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-indigo-200 hover:bg-slate-50"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border-indigo-200 bg-indigo-50 px-2.5 text-indigo-700"
                                                            >
                                                                {
                                                                    scenarioTypeLabelMap[
                                                                        scenario.category as WritingScenarioType
                                                                    ]
                                                                }
                                                            </Badge>
                                                            <span className="text-xs font-medium text-slate-400">
                                                                {scenario.difficulty}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-semibold text-slate-900">
                                                                {scenario.title}
                                                            </p>
                                                            <p className="mt-2 text-sm leading-7 text-slate-600">
                                                                {scenario.prompt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 rounded-full border border-slate-200 p-2 text-slate-400 transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                                            No exam scenarios are available right now.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-2xl border-indigo-100 bg-indigo-50/40 shadow-sm">
                            <CardContent className="p-6">
                                <SectionHeader
                                    icon={<Plus className="h-4 w-4" />}
                                    title="Custom prompt"
                                    description="Turn your own question into a clean writing session without leaving the workspace."
                                />

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {(
                                            ["daily", ...examScenarioTypes] as WritingScenarioType[]
                                        ).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setCustomScenarioType(type)}
                                                className={cn(
                                                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                                                    customScenarioType === type
                                                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                                        : "border-white/60 bg-white/80 text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
                                                )}
                                            >
                                                {scenarioTypeLabelMap[type]}
                                            </button>
                                        ))}
                                    </div>

                                    <Textarea
                                        rows={8}
                                        value={customPrompt}
                                        onChange={(event) =>
                                            setCustomPrompt(event.target.value)
                                        }
                                        placeholder="Paste or write your own prompt here."
                                        className="rounded-[22px] border-white/60 bg-white/90 px-4 py-3 font-mono text-sm leading-7 shadow-sm focus-visible:ring-indigo-500"
                                    />

                                    <Button
                                        className="h-10 w-full rounded-2xl bg-indigo-600 text-sm font-semibold shadow-sm hover:bg-indigo-700"
                                        disabled={
                                            !customPrompt.trim() ||
                                            pendingKey === "custom"
                                        }
                                        onClick={() =>
                                            void startExercise({
                                                key: "custom",
                                                scenarioType: customScenarioType,
                                                prompt: customPrompt.trim(),
                                                isCustomPrompt: true,
                                            })
                                        }
                                    >
                                        Start writing
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                            <CardHeader className="px-6 pt-6">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    Recent writing history
                                </CardTitle>
                                <CardDescription>
                                    Browse saved drafts and reviewed essays with clearer
                                    metadata and denser scanning.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 px-6 pb-6">
                                {history.exercises.length > 0 ? (
                                    history.exercises.map((exercise) => (
                                        <Link
                                            key={exercise.id}
                                            href={`/writing/${exercise.id}`}
                                            className={`group block rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-indigo-200 hover:bg-white ${writingPaperClass}`}
                                        >
                                            <div className="relative flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full border-indigo-200 bg-white px-2.5 text-indigo-700"
                                                        >
                                                            {
                                                                scenarioTypeLabelMap[
                                                                    exercise.scenarioType
                                                                ]
                                                            }
                                                        </Badge>
                                                        <span className="text-xs text-slate-400">
                                                            {formatDate(exercise.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 line-clamp-2 font-mono text-sm leading-7 text-slate-700">
                                                        {exercise.prompt}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {exercise.wordCount} words
                                                    </p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                                                        {exercise.status}
                                                    </p>
                                                    {exercise.overallScore !== null ? (
                                                        <p className="mt-3 text-lg font-semibold text-indigo-700">
                                                            {exercise.overallScore.toFixed(1)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                                        No writing records yet. Finished drafts and reviews
                                        will appear here.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
