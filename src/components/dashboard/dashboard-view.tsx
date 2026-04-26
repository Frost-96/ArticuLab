"use client";

import Link from "next/link";
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
import { useRouter } from "next/navigation";
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
    writing: "bg-indigo-100 text-indigo-600",
    speaking: "bg-violet-100 text-violet-600",
    coach: "bg-emerald-100 text-emerald-600",
};

export function DashboardView({ data }: DashboardViewProps) {
    const router = useRouter();

    const recordedHours = Math.floor(data.stats.recordedPracticeMinutes / 60);
    const recordedMinutes = data.stats.recordedPracticeMinutes % 60;

    const statsCards = [
        {
            label: "Total Sessions",
            value: String(data.stats.totalSessions),
            detail: `${data.stats.writingCount} writing | ${data.stats.speakingCount} speaking | ${data.stats.coachChatCount} coach`,
            icon: BookOpen,
            iconClassName: "bg-indigo-100 text-indigo-600",
        },
        {
            label: "Recorded Practice Time",
            value: `${recordedHours}h ${recordedMinutes}m`,
            detail: "Based on completed speaking sessions",
            icon: Clock,
            iconClassName: "bg-violet-100 text-violet-600",
        },
        {
            label: "Current Streak",
            value: `${data.stats.consecutiveDays}`,
            detail:
                data.stats.consecutiveDays > 0
                    ? "Keep the momentum going"
                    : "Start a session to begin a streak",
            icon: Flame,
            iconClassName: "bg-amber-100 text-amber-600",
        },
        {
            label: "Current Level",
            value: data.header.englishLevelLabel ?? "Not set",
            detail:
                data.header.englishLevelLabel ??
                "Complete onboarding to set your level",
            icon: Trophy,
            iconClassName: "bg-emerald-100 text-emerald-600",
        },
    ];

    return (
        <div className="min-h-[calc(100vh-56px)] bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Welcome back, {data.header.displayName}
                            </h1>
                            <Badge
                                variant={
                                    data.header.membershipTier === "pro"
                                        ? "default"
                                        : "secondary"
                                }
                                className={cn(
                                    data.header.membershipTier === "pro"
                                        ? "bg-indigo-600 text-white"
                                        : "",
                                )}
                            >
                                {data.header.membershipTier === "pro" ? "Pro" : "Free"}
                            </Badge>
                        </div>
                        <p className="mt-1 text-slate-500">
                            Your dashboard now reflects real activity from the
                            database.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                            <Calendar className="size-4 text-slate-500" />
                            Last 8 weeks
                        </div>
                        <Button
                            asChild
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Link href="/writing">
                                Start Learning
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statsCards.map((card) => (
                        <Card key={card.label}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="mb-1 text-sm text-slate-500">
                                            {card.label}
                                        </p>
                                        <p className="truncate text-3xl font-bold text-slate-900">
                                            {card.value}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {card.detail}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "flex size-12 shrink-0 items-center justify-center rounded-xl",
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Breakdown</CardTitle>
                            <CardDescription>
                                Writing scores are normalized to a 10-point scale;
                                speaking uses reviewed fluency and accuracy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.emptyStates.hasFullRadarData ? (
                                <div className="h-[300px]">
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
                                                stroke="#6366f1"
                                                fill="#6366f1"
                                                fillOpacity={0.2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <ModuleEmptyState
                                    title="Not enough reviewed data yet"
                                    description="Complete at least one reviewed writing exercise and one reviewed speaking exercise to unlock the full radar chart."
                                    actions={[
                                        { href: "/writing", label: "Start writing" },
                                        { href: "/speaking", label: "Start speaking" },
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Trend</CardTitle>
                            <CardDescription>
                                Weekly averages for writing overall score and
                                speaking fluency.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.emptyStates.hasTrendData ? (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.trend}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e2e8f0"
                                            />
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
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                dot={{ fill: "#6366f1" }}
                                                name="Writing Overall"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="speakingScore"
                                                stroke="#a855f7"
                                                strokeWidth={2}
                                                dot={{ fill: "#a855f7" }}
                                                name="Speaking Fluency"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <ModuleEmptyState
                                    title="Not enough data yet"
                                    description="Complete a few reviewed exercises to populate your weekly trend lines."
                                    actions={[
                                        {
                                            href: "/writing",
                                            label: "Start a writing review",
                                        },
                                        {
                                            href: "/speaking",
                                            label: "Start a speaking review",
                                        },
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Target className="size-4 text-amber-600" />
                                Areas to Improve
                            </CardTitle>
                            <CardDescription>
                                Extracted from recent reviewed feedback when it is
                                available.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.emptyStates.hasWeaknessData ? (
                                data.weaknesses.map((weakness) => (
                                    <div
                                        key={`${weakness.category}-${weakness.description}`}
                                        className="rounded-lg border border-amber-100 bg-amber-50 p-3"
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
                                                    Seen {weakness.frequency} time
                                                    {weakness.frequency > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={weakness.href}>
                                                    Practice
                                                    <ArrowRight className="ml-1 size-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                        <p className="mt-3 text-xs text-slate-600">
                                            {weakness.suggestion}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <ModuleEmptyState
                                    title="Complete a few reviewed exercises to unlock insights"
                                    description="We only show weakness analysis when reviewed feedback contains enough structured signals."
                                    actions={[
                                        { href: "/writing", label: "Go to writing" },
                                        { href: "/speaking", label: "Go to speaking" },
                                        { href: "/coach", label: "Open coach" },
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="size-4 text-slate-600" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                Writing, speaking, and coach activity merged from
                                real records.
                            </CardDescription>
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
                                                className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-slate-50"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
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

                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full"
                                        asChild
                                    >
                                        <Link href="/writing">Start a new session</Link>
                                    </Button>
                                </div>
                            ) : (
                                <ModuleEmptyState
                                    title="No activity yet"
                                    description="Once you complete writing, speaking, or coach sessions, they will appear here automatically."
                                    actions={[
                                        { href: "/writing", label: "Writing" },
                                        { href: "/speaking", label: "Speaking" },
                                        { href: "/coach", label: "Coach" },
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
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                <LayoutDashboard className="size-5" />
            </div>
            <p className="text-base font-medium text-slate-900">{title}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {description}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {actions.map((action) => (
                    <Button key={action.href + action.label} variant="outline" asChild>
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ))}
            </div>
        </div>
    );
}
