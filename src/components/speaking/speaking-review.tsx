import Link from "next/link";
import { ArrowLeft, MessageSquare, Mic, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SpeakingExerciseDetail } from "@/types/speaking/speakingTypes";

type SpeakingReviewProps = {
    exercise: SpeakingExerciseDetail;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function SpeakingReview({ exercise }: SpeakingReviewProps) {
    const feedback = exercise.feedback;

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href={`/speaking/${exercise.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Speaking Review
                        </h1>
                        <p className="mt-1 text-slate-500">
                            {exercise.title} | {formatDate(exercise.createdAt)}
                        </p>
                    </div>
                </div>

                <Badge variant="outline">{exercise.scenarioType}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    label="Fluency"
                    value={exercise.fluencyScore?.toFixed(1) ?? "--"}
                    tone="text-emerald-600"
                />
                <MetricCard
                    label="Accuracy"
                    value={exercise.accuracyScore?.toFixed(1) ?? "--"}
                    tone="text-slate-900"
                />
                <MetricCard
                    label="Duration"
                    value={formatDuration(exercise.durationSeconds)}
                    tone="text-slate-900"
                />
                <MetricCard
                    label="Turns"
                    value={String(exercise.totalTurns)}
                    tone="text-slate-900"
                />
            </div>

            {feedback ? (
                <>
                    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    Score Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    ["Fluency", feedback.fluencyScore],
                                    ["Accuracy", feedback.accuracyScore],
                                ].map(([label, value]) => (
                                    <div
                                        key={label as string}
                                        className="rounded-xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-500">
                                                {label}
                                            </p>
                                            <p className="text-2xl font-semibold text-slate-900">
                                                {(value as number).toFixed(1)}
                                            </p>
                                        </div>
                                        <Progress
                                            value={((value as number) / 10) * 100}
                                            className="mt-3 h-2"
                                        />
                                    </div>
                                ))}
                                <p className="text-sm leading-6 text-slate-600">
                                    {feedback.overallComment}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Strengths and Improvements</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="font-medium text-emerald-700">
                                        Strengths
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm text-emerald-900">
                                        {feedback.strengths.map((item) => (
                                            <p key={item}>{item}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="font-medium text-amber-700">
                                        Improvements
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm text-amber-900">
                                        {feedback.improvements.map((item) => (
                                            <p key={item}>{item}</p>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vocabulary Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Unique words</p>
                                <p className="mt-2 text-3xl font-semibold text-slate-900">
                                    {feedback.vocabularyAnalysis.totalUniqueWords}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {feedback.vocabularyAnalysis.advancedWordsUsed.map(
                                        (word) => (
                                            <Badge key={word} variant="outline">
                                                {word}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {feedback.vocabularyAnalysis.suggestedVocabulary.map(
                                    (item) => (
                                        <div
                                            key={item.word}
                                            className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                                        >
                                            <p className="font-medium text-blue-800">
                                                {item.word}
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-blue-950">
                                                {item.definition}
                                            </p>
                                            <p className="mt-3 text-xs leading-5 text-slate-600">
                                                {item.exampleSentence}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Common Mistakes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {feedback.grammarErrors.length > 0 ? (
                                    feedback.grammarErrors.map((item, index) => (
                                        <div
                                            key={`${item.original}-${index}`}
                                            className="rounded-xl border border-red-100 bg-red-50 p-4"
                                        >
                                            <p className="text-sm text-red-700">
                                                {item.original}
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-emerald-700">
                                                {item.corrected}
                                            </p>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {item.explanation}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyPanel message="No repeated grammar mistakes were found." />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Better Expressions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {feedback.expressionSuggestions.length > 0 ? (
                                    feedback.expressionSuggestions.map((item, index) => (
                                        <div
                                            key={`${item.original}-${index}`}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <p className="text-sm text-slate-500">
                                                Instead of
                                            </p>
                                            <p className="mt-1 text-sm text-slate-900">
                                                {item.original}
                                            </p>
                                            <p className="mt-3 text-sm text-slate-500">
                                                Try
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-emerald-700">
                                                {item.improved}
                                            </p>
                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                {item.explanation}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyPanel message="No expression upgrades are available yet." />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="space-y-3 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                            <Mic className="h-6 w-6 text-slate-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Review not ready yet
                        </h2>
                        <p className="text-sm leading-6 text-slate-500">
                            Your transcript is ready. Fluency, accuracy, and
                            expression feedback will appear here once the review is
                            available.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-slate-500" />
                        Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {exercise.messages.length > 0 ? (
                        exercise.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`rounded-xl px-4 py-3 text-sm leading-6 ${
                                    message.role === "assistant"
                                        ? "border border-slate-200 bg-white text-slate-700"
                                        : "bg-indigo-600 text-white"
                                }`}
                            >
                                <p className="mb-1 text-xs uppercase opacity-70">
                                    {message.role === "assistant" ? "Assistant" : "User"}
                                </p>
                                <p>{message.content}</p>
                            </div>
                        ))
                    ) : (
                        <EmptyPanel message="No transcript is available for this session." />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: string;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
            </CardContent>
        </Card>
    );
}

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            {message}
        </div>
    );
}
