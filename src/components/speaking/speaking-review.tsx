"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LoadingLink,
  useAppLoading,
  useLoadingRouter,
} from "@/components/ui/loading-overlay";
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  Sparkles,
  TrendingUp,
  Volume2,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import type {
  SpeakingExerciseDetail,
  SpeakingMessage,
} from "@/types/speaking/speakingTypes";
import type {
  PronunciationPhonemeResult,
  PronunciationResultLite,
  PronunciationWordResultLite,
} from "@/schema";

type SpeakingReviewProps = {
  exercise: SpeakingExerciseDetail;
};

type SpeakingReviewResponse =
  | { success: true; data: unknown }
  | { success: false; error: string };

type PronunciationEntry = {
  messageId: string;
  text: string;
  feedback: PronunciationResultLite;
};

type PronunciationMetric = {
  label: string;
  value: number;
};

type WeakPronunciationWord = PronunciationWordResultLite & {
  messageId: string;
  context: string;
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

function formatScore(value: number) {
  return Math.round(value).toString();
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }

  if (score >= 60) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  }

  return {
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  };
}

function getPronunciationEntries(
  messages: SpeakingMessage[],
): PronunciationEntry[] {
  return messages
    .filter(
      (message): message is SpeakingMessage & {
        pronunciationFeedback: PronunciationResultLite;
      } => message.role === "user" && Boolean(message.pronunciationFeedback),
    )
    .map((message) => ({
      messageId: message.id,
      text: message.content,
      feedback: message.pronunciationFeedback,
    }));
}

function averagePronunciationMetrics(
  entries: PronunciationEntry[],
): PronunciationMetric[] {
  const metrics = [
    ["Pronunciation", "pronunciationScore"],
    ["Accuracy", "accuracyScore"],
    ["Fluency", "fluencyScore"],
    ["Completeness", "completenessScore"],
    ["Prosody", "prosodyScore"],
  ] as const;

  return metrics.map(([label, key]) => ({
    label,
    value:
      entries.reduce((sum, entry) => sum + entry.feedback[key], 0) /
      Math.max(entries.length, 1),
  }));
}

function getWeakPronunciationWords(
  entries: PronunciationEntry[],
): WeakPronunciationWord[] {
  return entries
    .flatMap((entry) =>
      entry.feedback.words.map((word) => ({
        ...word,
        messageId: entry.messageId,
        context: entry.text,
      })),
    )
    .sort((a, b) => a.accuracyScore - b.accuracyScore)
    .slice(0, 12);
}

function splitIntoSyllables(word: string) {
  const cleaned = word.replace(/[^a-zA-Z']/g, "");
  if (cleaned.length <= 3) {
    return cleaned ? [cleaned] : [word];
  }

  const matches = cleaned.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
  return matches && matches.length > 0 ? matches : [cleaned];
}

function formatContext(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

export function SpeakingReview({ exercise }: SpeakingReviewProps) {
  const router = useLoadingRouter();
  const { hideLoading, showLoading } = useAppLoading();
  const feedback = exercise.feedback;
  const pronunciationEntries = getPronunciationEntries(exercise.messages);
  const pronunciationMetrics =
    averagePronunciationMetrics(pronunciationEntries);
  const weakPronunciationWords =
    getWeakPronunciationWords(pronunciationEntries);
  const shouldGenerateReview = !feedback && exercise.status === "completed";
  const hasRequestedReview = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const requestReview = useCallback(async () => {
    if (!shouldGenerateReview || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setReviewError(null);
    showLoading("Generating review...");

    try {
      const response = await fetch("/api/speaking/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exerciseId: exercise.id }),
      });
      const result = (await response.json()) as SpeakingReviewResponse;

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh("Loading review...");
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Failed to generate review",
      );
      hideLoading();
    } finally {
      setIsGenerating(false);
    }
  }, [
    exercise.id,
    hideLoading,
    isGenerating,
    router,
    shouldGenerateReview,
    showLoading,
  ]);

  useEffect(() => {
    if (!shouldGenerateReview || hasRequestedReview.current) {
      return;
    }

    hasRequestedReview.current = true;
    setIsGenerating(false);
    void requestReview();
  }, [requestReview, shouldGenerateReview]);

  return (
    <div className="page-container space-y-6">
      <div className="soft-panel flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <LoadingLink href={`/speaking/${exercise.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </LoadingLink>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
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
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
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
                    className="rounded-md bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{label}</p>
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

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Strengths and Improvements</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-medium text-emerald-700">Strengths</p>
                  <div className="mt-3 space-y-2 text-sm text-emerald-900">
                    {feedback.strengths.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-amber-700">Improvements</p>
                  <div className="mt-3 space-y-2 text-sm text-amber-900">
                    {feedback.improvements.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Vocabulary Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Unique words</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {feedback.vocabularyAnalysis.totalUniqueWords}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feedback.vocabularyAnalysis.advancedWordsUsed.map((word) => (
                    <Badge key={word} variant="outline">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {feedback.vocabularyAnalysis.suggestedVocabulary.map((item) => (
                  <div
                    key={item.word}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                  >
                    <p className="font-medium text-blue-800">{item.word}</p>
                    <p className="mt-1 text-sm leading-6 text-blue-950">
                      {item.definition}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {item.exampleSentence}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Common Mistakes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.grammarErrors.length > 0 ? (
                  feedback.grammarErrors.map((item, index) => (
                    <div
                      key={`${item.original}-${index}`}
                      className="rounded-lg border border-red-100 bg-red-50 p-4"
                    >
                      <p className="text-sm text-red-700">{item.original}</p>
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

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Better Expressions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.expressionSuggestions.length > 0 ? (
                  feedback.expressionSuggestions.map((item, index) => (
                    <div
                      key={`${item.original}-${index}`}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <p className="text-sm text-slate-500">Instead of</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {item.original}
                      </p>
                      <p className="mt-3 text-sm text-slate-500">Try</p>
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

          <PronunciationAnalysis
            exerciseId={exercise.id}
            entries={pronunciationEntries}
            metrics={pronunciationMetrics}
            weakWords={weakPronunciationWords}
          />
        </>
      ) : (
        <Card className="border-dashed bg-white shadow-sm">
          <CardContent className="space-y-3 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
              {isGenerating ? (
                <TrendingUp className="h-6 w-6 animate-pulse text-sky-600" />
              ) : (
                <Mic className="h-6 w-6 text-slate-500" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isGenerating ? "Generating review" : "Review not ready yet"}
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              {isGenerating
                ? "Your transcript is ready. Fluency, accuracy, and expression feedback are being generated now."
                : "Your transcript is ready. Fluency, accuracy, and expression feedback will appear here once the review is available."}
            </p>
            {reviewError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {reviewError}
              </div>
            ) : null}
            {shouldGenerateReview ? (
              <LoadingButton
                onClick={() => void requestReview()}
                isLoading={isGenerating}
                loadingText="Generating..."
              >
                Retry review
              </LoadingButton>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-sm">
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
                className={`rounded-lg px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border border-slate-200 bg-white text-slate-700"
                    : "bg-sky-600 text-white"
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

function PronunciationAnalysis({
  exerciseId,
  entries,
  metrics,
  weakWords,
}: {
  exerciseId: string;
  entries: PronunciationEntry[];
  metrics: PronunciationMetric[];
  weakWords: WeakPronunciationWord[];
}) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed bg-white shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Volume2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Pronunciation Analysis
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pronunciation analysis appears after evaluating your recorded
              responses in the speaking session.
            </p>
          </div>
          <Button variant="outline" asChild>
            <LoadingLink href={`/speaking/${exerciseId}`}>
              Back to practice
            </LoadingLink>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="size-5 text-blue-600" />
          Pronunciation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          {metrics.map((metric) => {
            const tone = getScoreTone(metric.value);

            return (
              <div
                key={metric.label}
                className={cn(
                  "rounded-lg border p-4",
                  tone.border,
                  tone.bg,
                )}
              >
                <p className="text-xs font-medium uppercase text-slate-500">
                  {metric.label}
                </p>
                <p className={cn("mt-2 text-2xl font-semibold", tone.text)}>
                  {formatScore(metric.value)}
                </p>
                <Progress value={metric.value} className="mt-3 h-1.5" />
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Weak Words and Phonemes
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Lowest-scoring words across your evaluated responses.
              </p>
            </div>

            {weakWords.length > 0 ? (
              <div className="grid gap-3">
                {weakWords.map((word, index) => (
                  <WeakWordCard
                    key={`${word.messageId}-${word.word}-${index}`}
                    word={word}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanel message="No word-level pronunciation details are available yet." />
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-blue-950">
                How to read this
              </h3>
            </div>
            <p className="text-sm leading-6 text-blue-950/80">
              Word and phoneme scores come from the saved pronunciation
              assessment. Syllables are derived from the word spelling for
              visual grouping and reuse the word score.
            </p>
            <div className="space-y-2 text-xs text-blue-950/70">
              <LegendRow colorClass="bg-emerald-500" label="80-100 strong" />
              <LegendRow colorClass="bg-amber-500" label="60-79 needs care" />
              <LegendRow colorClass="bg-red-500" label="Below 60 priority" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeakWordCard({ word }: { word: WeakPronunciationWord }) {
  const tone = getScoreTone(word.accuracyScore);
  const syllables = splitIntoSyllables(word.word);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-base font-semibold text-slate-950">
              {word.word}
            </p>
            {word.errorType && word.errorType !== "None" ? (
              <Badge variant="outline" className="border-red-200 text-red-700">
                {word.errorType}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {formatContext(word.context)}
          </p>
        </div>
        <div
          className={cn(
            "w-fit rounded-md border px-2.5 py-1 text-sm font-semibold",
            tone.border,
            tone.bg,
            tone.text,
          )}
        >
          {formatScore(word.accuracyScore)}
        </div>
      </div>

      {word.phonemes?.length ? (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-slate-400">
            <Waves className="size-3.5" />
            Phonemes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {word.phonemes.map((phoneme, index) => (
              <PhonemeBadge
                key={`${word.messageId}-${word.word}-${phoneme.phoneme}-${index}`}
                phoneme={phoneme}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase text-slate-400">
          Syllables derived from spelling
        </p>
        <div className="flex flex-wrap gap-1.5">
          {syllables.map((syllable, index) => (
            <span
              key={`${word.messageId}-${word.word}-syllable-${index}`}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium",
                tone.border,
                tone.bg,
                tone.text,
              )}
            >
              {syllable}
              <span className="ml-1 font-normal opacity-70">
                {formatScore(word.accuracyScore)}
              </span>
            </span>
          ))}
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
            derived
          </span>
        </div>
      </div>
    </div>
  );
}

function PhonemeBadge({
  phoneme,
}: {
  phoneme: PronunciationPhonemeResult;
}) {
  const tone = getScoreTone(phoneme.accuracyScore);

  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-medium",
        tone.border,
        tone.bg,
        tone.text,
      )}
    >
      {phoneme.phoneme}
      <span className="ml-1 font-normal opacity-70">
        {formatScore(phoneme.accuracyScore)}
      </span>
    </span>
  );
}

function LegendRow({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", colorClass)} />
      {label}
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
    <Card className="bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}
