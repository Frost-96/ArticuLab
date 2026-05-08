import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, FileText, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SentenceFeedback } from "@/schema";
import type { WritingExerciseDetail } from "@/types/writing/writingTypes";

type WritingReviewProps = {
    exercise: WritingExerciseDetail;
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

function getAnnotationClass(severity: SentenceFeedback["severity"]) {
    switch (severity) {
        case "error":
            return "border-red-200 bg-red-50 text-red-900 decoration-red-500";
        case "warning":
            return "border-amber-200 bg-amber-50 text-amber-950 decoration-amber-500";
        case "suggestion":
            return "border-blue-200 bg-blue-50 text-blue-950 decoration-blue-500";
    }
}

function getAnnotationLabel(severity: SentenceFeedback["severity"]) {
    switch (severity) {
        case "error":
            return "Error";
        case "warning":
            return "Suggestion";
        case "suggestion":
            return "Advanced tip";
    }
}

function AnnotatedEssay({
    content,
    feedback,
}: {
    content: string;
    feedback: SentenceFeedback[];
}) {
    if (!content.trim()) {
        return <p className="text-sm text-slate-500">No submitted content.</p>;
    }

    const matches = feedback
        .map((item) => ({ item, index: content.indexOf(item.original) }))
        .filter((match) => match.index >= 0)
        .sort((a, b) => a.index - b.index);

    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of matches) {
        if (match.index < cursor) {
            continue;
        }

        if (match.index > cursor) {
            nodes.push(content.slice(cursor, match.index));
        }

        nodes.push(
            <mark
                key={`${match.item.original}-${match.index}`}
                title={match.item.explanation}
                className={`rounded border px-1 underline decoration-2 underline-offset-4 ${getAnnotationClass(match.item.severity)}`}
            >
                {match.item.original}
            </mark>,
        );
        cursor = match.index + match.item.original.length;
    }

    if (cursor < content.length) {
        nodes.push(content.slice(cursor));
    }

    return (
        <div className="whitespace-pre-wrap text-sm leading-8 text-slate-700">
            {nodes}
        </div>
    );
}

export function WritingReview({ exercise }: WritingReviewProps) {
    const feedback = exercise.feedback;

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href={`/writing/${exercise.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Writing Review
                        </h1>
                        <p className="mt-1 text-slate-500">
                            Status: {exercise.status} | Created{" "}
                            {formatDate(exercise.createdAt)}
                        </p>
                    </div>
                </div>

                <Badge variant="outline">{exercise.scenarioType}</Badge>
            </div>

            {feedback ? (
                <>
                    <div className="grid gap-4 md:grid-cols-5">
                        <Card className="md:col-span-2">
                            <CardContent className="p-6">
                                <p className="text-sm text-slate-500">Overall Score</p>
                                <p className="mt-2 text-5xl font-semibold text-emerald-600">
                                    {feedback.overallScore.toFixed(1)}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {feedback.overallComment}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3">
                            <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    ["Grammar", feedback.grammarScore],
                                    ["Vocabulary", feedback.vocabularyScore],
                                    ["Coherence", feedback.coherenceScore],
                                    ["Task", feedback.taskScore],
                                ].map(([label, score]) => (
                                    <div
                                        key={label as string}
                                        className="rounded-xl bg-slate-50 p-4"
                                    >
                                        <p className="text-sm text-slate-500">{label}</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                                            {(score as number).toFixed(1)}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle>Your Essay</CardTitle>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {[
                                            [
                                                "Error",
                                                "border-red-200 bg-red-50 text-red-700",
                                            ],
                                            [
                                                "Suggestion",
                                                "border-amber-200 bg-amber-50 text-amber-700",
                                            ],
                                            [
                                                "Advanced tip",
                                                "border-blue-200 bg-blue-50 text-blue-700",
                                            ],
                                        ].map(([label, className]) => (
                                            <span
                                                key={label}
                                                className={`rounded-full border px-2 py-1 ${className}`}
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-5">
                                    <AnnotatedEssay
                                        content={exercise.content}
                                        feedback={feedback.sentenceFeedback}
                                    />
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                                            <Sparkles className="h-4 w-4" />
                                            Strengths
                                        </p>
                                        <div className="mt-3 space-y-2 text-sm text-emerald-900">
                                            {feedback.strengths.map((item) => (
                                                <p key={item}>{item}</p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                                            <MessageSquare className="h-4 w-4" />
                                            Improvements
                                        </p>
                                        <div className="mt-3 space-y-2 text-sm text-amber-900">
                                            {feedback.improvements.map((item) => (
                                                <p key={item}>{item}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Improvement Plan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {feedback.improvements.map((item) => (
                                        <div
                                            key={item}
                                            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
                                        >
                                            {item}
                                        </div>
                                    ))}

                                    {feedback.sampleExpressions?.length ? (
                                        <div className="space-y-3 border-t border-slate-200 pt-4">
                                            <p className="text-sm font-medium text-slate-900">
                                                Sample rewritten sentences
                                            </p>
                                            {feedback.sampleExpressions.map((item) => (
                                                <div
                                                    key={`${item.original}-${item.improved}`}
                                                    className="rounded-xl border border-slate-200 p-4"
                                                >
                                                    <p className="text-xs uppercase tracking-wide text-slate-400">
                                                        Instead of
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        {item.original}
                                                    </p>
                                                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                                                        Try
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-emerald-700">
                                                        {item.improved}
                                                    </p>
                                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                                        {item.explanation}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Inline Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {feedback.sentenceFeedback.length > 0 ? (
                                        feedback.sentenceFeedback.map((item, index) => (
                                            <div
                                                key={`${item.original}-${index}`}
                                                className="rounded-xl border border-slate-200 p-4"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            item.severity === "error"
                                                                ? "border-red-200 bg-red-50 text-red-700"
                                                                : item.severity === "warning"
                                                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                                                  : "border-blue-200 bg-blue-50 text-blue-700"
                                                        }
                                                    >
                                                        {getAnnotationLabel(item.severity)}
                                                    </Badge>
                                                    <span className="text-xs uppercase text-slate-400">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-sm text-slate-700">
                                                    {item.original}
                                                </p>
                                                {item.corrected ? (
                                                    <p className="mt-2 text-sm font-medium text-emerald-700">
                                                        {item.corrected}
                                                    </p>
                                                ) : null}
                                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                                    {item.explanation}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                                            No sentence-level notes are available yet.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <Card className="border-dashed">
                        <CardContent className="space-y-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                <FileText className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Review not ready yet
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Your draft is saved. Once feedback is available,
                                    scores, annotations, and rewrite suggestions will
                                    appear here.
                                </p>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>Words: {exercise.wordCount}</p>
                                <p>Status: {exercise.status}</p>
                                <p>Created: {formatDate(exercise.createdAt)}</p>
                                <p>
                                    Last Updated:{" "}
                                    {formatDate(exercise.evaluatedAt ?? exercise.createdAt)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Essay Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                                {exercise.content || "No content saved yet."}
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Prompt
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {exercise.prompt}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
