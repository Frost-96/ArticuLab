import Link from "next/link";
import type { ComponentType } from "react";
import {
    BookOpen,
    Clock,
    Crown,
    Flame,
    Mic,
    PenLine,
    Sparkles,
    Star,
    Target,
    TrendingUp,
} from "lucide-react";
import type { ProfileData } from "@/schema";
import { getInitials } from "@/lib/user-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProfileViewProps = {
    data: ProfileData;
};

const achievementIconMap = {
    "first-essay": PenLine,
    "seven-day-streak": Flame,
    "pro-member": Crown,
    "speaking-star": Star,
};

export function ProfileView({ data }: ProfileViewProps) {
    const initials = getInitials(data.header.displayName);
    const studyHours = Math.floor(data.stats.studyMinutes / 60);
    const studyMinutes = data.stats.studyMinutes % 60;

    const statsCards = [
        {
            label: "Words Written",
            value: data.stats.totalWords.toLocaleString(),
            icon: PenLine,
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
        },
        {
            label: "Essays Reviewed",
            value: String(data.stats.reviewedWritingCount),
            icon: TrendingUp,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
        },
        {
            label: "Speaking Sessions",
            value: String(data.stats.completedSpeakingCount),
            icon: Mic,
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
        },
        {
            label: "Avg Fluency / Accuracy",
            value:
                data.stats.avgFluency !== null && data.stats.avgAccuracy !== null
                    ? `${data.stats.avgFluency.toFixed(1)} / ${data.stats.avgAccuracy.toFixed(1)}`
                    : "No data",
            icon: Star,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
        },
    ];

    return (
        <div className="min-h-[calc(100vh-56px)] bg-slate-50 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={data.header.avatar ?? undefined}
                                        alt={data.header.displayName}
                                    />
                                    <AvatarFallback className="bg-indigo-100 text-2xl font-semibold text-indigo-700">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-semibold text-slate-900">
                                            {data.header.displayName}
                                        </h1>
                                        <Badge
                                            variant={
                                                data.header.membershipTier === "pro"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className={
                                                data.header.membershipTier === "pro"
                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                                    : ""
                                            }
                                        >
                                            {data.header.membershipTier === "pro" ? (
                                                <>
                                                    <Crown className="mr-1 h-3 w-3" />
                                                    Pro
                                                </>
                                            ) : (
                                                "Free"
                                            )}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-slate-500">
                                        {data.header.email}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {data.header.englishLevelLabel ?? "Level not set"}
                                        </Badge>
                                        <Badge variant="outline">
                                            {data.header.learningGoalLabel ?? "Goal not set"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-wrap items-center gap-4 lg:justify-end">
                                <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                    <Flame className="h-4 w-4 text-amber-500" />
                                    {data.stats.streak} day streak
                                </div>
                                <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                    {data.stats.totalSessions} sessions
                                </div>
                                <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                    {studyHours}h {studyMinutes}m recorded
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href="/settings">Edit in Settings</Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statsCards.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <div
                                    className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}
                                >
                                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {stat.value}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Skill Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.emptyStates.hasSkillData ? (
                                <div className="space-y-4">
                                    {data.skills.map((skill) => (
                                        <div key={skill.skill}>
                                            <div className="mb-1.5 flex items-center justify-between text-sm">
                                                <span className="text-slate-700">
                                                    {skill.skill}
                                                </span>
                                                <span className="font-medium text-slate-900">
                                                    {skill.scoreLabel ?? "No data"}
                                                </span>
                                            </div>
                                            <Progress
                                                value={skill.progress ?? 0}
                                                className="h-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ProfileEmptyState
                                    icon={Target}
                                    title="No reviewed skill data yet"
                                    description="Complete a reviewed writing or speaking session to unlock your real skill breakdown."
                                    actions={[
                                        { href: "/writing", label: "Start writing" },
                                        { href: "/speaking", label: "Start speaking" },
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Learning Snapshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <BookOpen className="h-4 w-4 text-indigo-500" />
                                    Total sessions
                                </div>
                                <span className="font-medium text-slate-900">
                                    {data.stats.totalSessions}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock className="h-4 w-4 text-violet-500" />
                                    Recorded practice
                                </div>
                                <span className="font-medium text-slate-900">
                                    {studyHours}h {studyMinutes}m
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Flame className="h-4 w-4 text-amber-500" />
                                    Current streak
                                </div>
                                <span className="font-medium text-slate-900">
                                    {data.stats.streak} days
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Sparkles className="h-4 w-4 text-emerald-500" />
                                    Profile state
                                </div>
                                <span className="font-medium text-slate-900">
                                    {data.emptyStates.hasAnyActivity
                                        ? "Active learner"
                                        : "Just getting started"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {data.achievements.map((achievement) => {
                                const Icon =
                                    achievementIconMap[achievement.id as keyof typeof achievementIconMap] ??
                                    Star;

                                return (
                                    <div
                                        key={achievement.id}
                                        className={`rounded-xl border p-4 transition-opacity ${
                                            achievement.earned
                                                ? "border-slate-200 bg-white opacity-100"
                                                : "border-slate-100 bg-slate-50 opacity-60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                    achievement.earned
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-slate-200 text-slate-500"
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {achievement.label}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {achievement.earned ? "Unlocked" : "Locked"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs leading-5 text-slate-500">
                                            {achievement.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProfileEmptyState({
    icon: Icon,
    title,
    description,
    actions,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    actions: Array<{ href: string; label: string }>;
}) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                <Icon className="h-5 w-5" />
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
