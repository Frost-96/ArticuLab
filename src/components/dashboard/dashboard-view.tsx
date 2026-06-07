"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  LayoutDashboard,
  MessageSquare,
  Mic,
  PenLine,
  Target,
  Trophy,
} from "lucide-react";
import { LoadingLink, useLoadingRouter } from "@/components/ui/loading-overlay";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "@/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  data: DashboardData;
};

const activityIconMap = {
  writing: PenLine,
  speaking: Mic,
  coach: MessageSquare,
};

const activityColorMap = {
  writing: "bg-sky-100 text-sky-600",
  speaking: "bg-blue-100 text-blue-600",
  coach: "bg-emerald-100 text-emerald-600",
};

export function DashboardView({ data }: DashboardViewProps) {
  const router = useLoadingRouter();
  const t = useTranslations("dashboard");
  const nav = useTranslations("nav");
  const common = useTranslations("common");

  const recordedHours = Math.floor(data.stats.recordedPracticeMinutes / 60);
  const recordedMinutes = data.stats.recordedPracticeMinutes % 60;

  const statsCards = [
    {
      label: t("totalSessions"),
      value: String(data.stats.totalSessions),
      detail: t("totalDetail", {
        writing: data.stats.writingCount,
        speaking: data.stats.speakingCount,
        coach: data.stats.coachChatCount,
      }),
      icon: BookOpen,
      iconClassName: "bg-sky-100 text-sky-600",
    },
    {
      label: t("recordedTime"),
      value: `${recordedHours}h ${recordedMinutes}m`,
      detail: t("recordedDetail"),
      icon: Clock,
      iconClassName: "bg-blue-100 text-blue-600",
    },
    {
      label: t("currentStreak"),
      value: `${data.stats.consecutiveDays}`,
      detail:
        data.stats.consecutiveDays > 0 ? t("streakActive") : t("streakEmpty"),
      icon: Flame,
      iconClassName: "bg-amber-100 text-amber-600",
    },
    {
      label: t("currentLevel"),
      value: data.header.englishLevelLabel ?? common("notSet"),
      detail: data.header.englishLevelLabel ?? t("levelEmpty"),
      icon: Trophy,
      iconClassName: "bg-emerald-100 text-emerald-600",
    },
  ];
  const quickActions = [
    {
      label: nav("writing"),
      description: t("quickWriting"),
      href: "/writing",
      icon: PenLine,
      className: "bg-sky-100 text-sky-700",
    },
    {
      label: nav("speaking"),
      description: t("quickSpeaking"),
      href: "/speaking",
      icon: Mic,
      className: "bg-blue-100 text-blue-700",
    },
    {
      label: nav("coach"),
      description: t("quickCoach"),
      href: "/coach",
      icon: MessageSquare,
      className: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="app-shell-page">
      <div className="page-container space-y-6">
        <div className="soft-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {t("welcome", { name: data.header.displayName })}
              </h1>
              <Badge
                variant={
                  data.header.membershipTier === "pro" ? "default" : "secondary"
                }
                className={cn(
                  data.header.membershipTier === "pro"
                    ? "bg-sky-600 text-white"
                    : "",
                )}
              >
                {data.header.membershipTier === "pro"
                  ? common("pro")
                  : common("free")}
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t("summary")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Calendar className="size-4 text-slate-500" />
              {t("lastWeeks")}
            </div>
            {quickActions.map((action) => (
              <Button key={action.href} variant="outline" asChild>
                <LoadingLink href={action.href}>
                  <action.icon className="mr-2 size-4" />
                  {action.label}
                </LoadingLink>
              </Button>
            ))}
          </div>
        </div>

        {data.continueItems.length > 0 ? (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{t("continueTitle")}</CardTitle>
              <CardDescription>{t("continueDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {data.continueItems.map((item) => {
                const ItemIcon = activityIconMap[item.type];
                const colorClass = activityColorMap[item.type];

                return (
                  <LoadingLink
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="group rounded-md border border-slate-200 p-4 transition-colors hover:border-sky-200 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-md",
                          colorClass,
                        )}
                      >
                        <ItemIcon className="size-4" />
                      </div>
                      <ArrowRight className="mt-1 size-4 text-slate-300 transition-colors group-hover:text-sky-600" />
                    </div>
                    <p className="mt-4 truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.subtitle}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-600">
                        {item.statusLabel}
                      </span>
                      <span className="text-slate-400">{item.timeLabel}</span>
                    </div>
                  </LoadingLink>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <Card key={card.label} className="bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="mb-1 text-sm text-slate-500">{card.label}</p>
                    <p className="truncate text-3xl font-semibold tracking-tight text-slate-950">
                      {card.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{card.detail}</p>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      card.iconClassName,
                    )}
                  >
                    <card.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{t("skillBreakdown")}</CardTitle>
              <CardDescription>{t("skillDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.emptyStates.hasFullRadarData ? (
                <div className="h-[300px] min-h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.radar}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#0ea5e9"
                        fill="#0ea5e9"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ModuleEmptyState
                  title={t("notEnoughReviewed")}
                  description={t("radarEmpty")}
                  actions={[
                    { href: "/writing", label: t("startWriting") },
                    { href: "/speaking", label: t("startSpeaking") },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{t("progressTrend")}</CardTitle>
              <CardDescription>{t("trendDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.emptyStates.hasTrendData ? (
                <div className="h-[300px] min-h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        domain={[0, 10]}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="writingScore"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ fill: "#0ea5e9" }}
                        name={t("writingOverall")}
                      />
                      <Line
                        type="monotone"
                        dataKey="speakingScore"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={{ fill: "#38bdf8" }}
                        name={t("speakingFluency")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ModuleEmptyState
                  title={t("notEnoughData")}
                  description={t("trendEmpty")}
                  actions={[
                    {
                      href: "/writing",
                      label: t("startWritingReview"),
                    },
                    {
                      href: "/speaking",
                      label: t("startSpeakingReview"),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-amber-600" />
                {t("areas")}
              </CardTitle>
              <CardDescription>{t("areasDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.emptyStates.hasWeaknessData ? (
                data.weaknesses.map((weakness) => (
                  <div
                    key={`${weakness.category}-${weakness.description}`}
                    className="rounded-md border border-amber-100 bg-amber-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {weakness.category}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {weakness.description}
                        </p>
                        <p className="mt-2 text-xs text-amber-700">
                          {t("seenTimes", { count: weakness.frequency })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <LoadingLink href={weakness.href}>
                          {t("practice")}
                          <ArrowRight className="ml-1 size-3" />
                        </LoadingLink>
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      {weakness.suggestion}
                    </p>
                  </div>
                ))
              ) : (
                <ModuleEmptyState
                  title={t("completeForInsights")}
                  description={t("insightsEmpty")}
                  actions={[
                    { href: "/writing", label: t("goToWriting") },
                    { href: "/speaking", label: t("goToSpeaking") },
                    { href: "/coach", label: t("openCoach") },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-slate-600" />
                {t("recentActivity")}
              </CardTitle>
              <CardDescription>{t("recentDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {data.recentActivities.map((activity) => {
                    const ActivityIcon = activityIconMap[activity.type];

                    return (
                      <button
                        key={`${activity.type}-${activity.id}`}
                        type="button"
                        onClick={() => router.push(activity.href)}
                        className="flex w-full items-center justify-between rounded-md p-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md",
                              activityColorMap[activity.type],
                            )}
                          >
                            <ActivityIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {activity.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {activity.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {activity.scoreLabel ? (
                            <p className="text-sm font-semibold text-emerald-600">
                              {activity.scoreLabel}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-400">
                            {activity.timeLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  <Button variant="outline" className="mt-4 w-full" asChild>
                    <LoadingLink href="/writing">
                      {t("startNewSession")}
                    </LoadingLink>
                  </Button>
                </div>
              ) : (
                <ModuleEmptyState
                  title={t("noActivity")}
                  description={t("activityEmpty")}
                  actions={[
                    { href: "/writing", label: nav("writing") },
                    { href: "/speaking", label: nav("speaking") },
                    { href: "/coach", label: nav("coach") },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ModuleEmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-white text-sky-600 shadow-sm">
        <LayoutDashboard className="size-5" />
      </div>
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {actions.map((action) => (
          <Button key={action.href + action.label} variant="outline" asChild>
            <LoadingLink href={action.href}>{action.label}</LoadingLink>
          </Button>
        ))}
      </div>
    </div>
  );
}
