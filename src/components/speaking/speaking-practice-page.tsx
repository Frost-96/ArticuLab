"use client";

import { useState, type ReactNode } from "react";
import {
  useAppLoading,
  useLoadingRouter,
} from "@/components/ui/loading-overlay";
import { useTranslations } from "next-intl";
import { ArrowRight, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startSpeakingAction } from "@/server/actions/speaking.action";
import type { ScenarioPrompt } from "@/types/scenario/scenarioTypes";
import type { SpeakingHistoryResult } from "@/types/speaking/speakingTypes";

type SpeakingPracticePageProps = {
  scenarios: ScenarioPrompt[];
  history: SpeakingHistoryResult;
  loadError?: string | null;
};

export function SpeakingPracticePage({
  scenarios,
  history,
  loadError,
}: SpeakingPracticePageProps) {
  const router = useLoadingRouter();
  const { hideLoading, showLoading } = useAppLoading();
  const t = useTranslations("speaking");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reviewedCount = history.exercises.filter(
    (exercise) => exercise.fluencyScore !== null,
  ).length;
  const continueExercises = [
    ...history.exercises.filter((exercise) => exercise.status === "in_progress"),
    ...history.exercises.filter((exercise) => exercise.status === "reviewed"),
  ].slice(0, 3);

  async function handleStart(scenarioId: string) {
    setPendingId(scenarioId);
    setError(null);
    showLoading(t("starting"));

    const result = await startSpeakingAction({ scenarioId });

    if (!result.success || !result.data) {
      setError(
        !result.success ? result.error : t("failedStart"),
      );
      setPendingId(null);
      hideLoading();
      return;
    }

    router.push(`/speaking/${result.data.exercise.id}`);
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {t("title")}
                </h1>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {t("badge")}
                </Badge>
              </div>
              <p className="mt-1 text-slate-500">
                {t("description")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
              <SpeakingSummaryCard
                label={t("sessions")}
                value={String(history.pagination.total)}
                tone="text-slate-900"
              />
              <SpeakingSummaryCard
                label={t("reviewed")}
                value={String(reviewedCount)}
                tone="text-blue-700"
              />
              <SpeakingSummaryCard
                label={t("scenarios")}
                value={String(scenarios.length)}
                tone="text-slate-900"
              />
            </div>
          </div>
        </div>

        {loadError ? (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4 text-sm text-amber-800">
              {loadError}
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {continueExercises.length > 0 ? (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("continueTitle")}</CardTitle>
              <CardDescription>
                {t("continueDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {continueExercises.map((exercise) => {
                const isActive = exercise.status === "in_progress";

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => router.push(`/speaking/${exercise.id}`)}
                    className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        variant={isActive ? "default" : "outline"}
                        className={
                          isActive
                            ? "bg-blue-600 text-white"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }
                      >
                        {isActive ? t("inProgress") : t("reviewedStatus")}
                      </Badge>
                      <ArrowRight className="size-4 text-slate-300 transition-colors group-hover:text-blue-600" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                      {exercise.title}
                    </p>
                    <p className="mt-2 truncate text-xs text-slate-500">
                      {t("turns", { count: exercise.totalTurns ?? 0 })}
                      {exercise.fluencyScore !== null
                        ? ` | ${t("fluency", {
                            score: exercise.fluencyScore.toFixed(1),
                          })}`
                        : ""}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-blue-50/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="size-4 text-blue-600" />
                {t("available")}
              </CardTitle>
              <CardDescription>
                {t("availableDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-4">
              {scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="relative rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200 hover:bg-slate-50"
                  >
                    <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-blue-200" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            {t(scenario.category)}
                          </Badge>
                          <Badge variant="secondary">
                            {scenario.difficulty}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {scenario.estimatedMinutes} min
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {scenario.title}
                        </p>
                        <p className="text-sm leading-6 text-slate-500">
                          {scenario.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t("role", {
                            role: scenario.aiRole ?? t("partner"),
                          })}
                        </p>
                      </div>

                      <LoadingButton
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        disabled={pendingId === scenario.id}
                        onClick={() => void handleStart(scenario.id)}
                        isLoading={pendingId === scenario.id}
                        loadingText={t("starting")}
                      >
                        {t("start")}
                        <ArrowRight className="ml-2 size-4" />
                      </LoadingButton>
                    </div>
                  </div>
                ))
              ) : (
                <PageEmptyState
                  icon={<Mic className="size-5" />}
                  iconClassName="text-blue-600"
                  title={t("noScenarios")}
                  description={t("noScenariosDescription")}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SpeakingSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function PageEmptyState({
  icon,
  iconClassName,
  title,
  description,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div
        className={`mx-auto flex size-11 items-center justify-center rounded-lg bg-white shadow-sm ${iconClassName}`}
      >
        {icon}
      </div>
      <p className="mt-4 text-base font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
