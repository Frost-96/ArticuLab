import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
    BookOpen,
    Check,
    Clock,
    Crown,
    Flame,
    Mic,
    PenLine,
    Star,
    Target,
    TrendingUp,
} from "lucide-react";
import type { ProfileData } from "@/schema";
import { getInitials } from "@/lib/user-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    const recordedPracticeLabel = `${studyHours}h ${studyMinutes}m`;
    const averageScoreLabel =
        data.stats.avgFluency !== null && data.stats.avgAccuracy !== null
            ? `${data.stats.avgFluency.toFixed(1)} / ${data.stats.avgAccuracy.toFixed(1)}`
            : "No data";

    const metrics = [
        {
            label: "Total sessions",
            value: String(data.stats.totalSessions),
            detail: data.emptyStates.hasAnyActivity
                ? "Across writing and speaking"
                : "No activity yet",
            icon: BookOpen,
        },
        {
            label: "Current streak",
            value: `${data.stats.streak} days`,
            detail: "Daily learning rhythm",
            icon: Flame,
        },
        {
            label: "Recorded practice",
            value: recordedPracticeLabel,
            detail: "Completed speaking sessions",
            icon: Clock,
        },
        {
            label: "Avg fluency / accuracy",
            value: averageScoreLabel,
            detail: "Reviewed speaking score",
            icon: TrendingUp,
        },
    ];

    const writingRows = [
        {
            label: "Words written",
            value: data.stats.totalWords.toLocaleString(),
        },
        {
            label: "Essays reviewed",
            value: String(data.stats.reviewedWritingCount),
        },
    ];

    const speakingRows = [
        {
            label: "Speaking sessions",
            value: String(data.stats.completedSpeakingCount),
        },
        {
            label: "Average score",
            value: averageScoreLabel,
        },
    ];

    return (
        <div className="app-shell-page bg-[#f7f7f7]">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                            Profile
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            A concise snapshot of your account and learning progress.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/settings">Edit settings</Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <section className="border-b border-slate-100 px-5 py-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="size-20">
                                <AvatarImage
                                    src={data.header.avatar ?? undefined}
                                    alt={data.header.displayName}
                                />
                                <AvatarFallback className="bg-slate-100 text-2xl font-medium text-slate-700">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-xl font-semibold text-slate-950">
                                        {data.header.displayName}
                                    </h2>
                                    <Badge
                                        variant={
                                            data.header.membershipTier === "pro"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {data.header.membershipTier === "pro" ? (
                                            <>
                                                <Crown className="size-3" />
                                                Pro
                                            </>
                                        ) : (
                                            "Free"
                                        )}
                                    </Badge>
                                </div>
                                <p className="mt-1 truncate text-sm text-slate-500">
                                    {data.header.email}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                        {data.header.englishLevelLabel ?? "Level not set"}
                                    </Badge>
                                    <Badge variant="outline">
                                        {data.header.learningGoalLabel ?? "Goal not set"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-slate-100 px-5 py-5">
                        <SectionTitle
                            title="Overview"
                            description="High-level activity from your practice history."
                        />
                        <div className="mt-4 grid gap-0 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                            {metrics.map((metric) => (
                                <MetricCell
                                    key={metric.label}
                                    label={metric.label}
                                    value={metric.value}
                                    detail={metric.detail}
                                    icon={<metric.icon className="size-4" />}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-0 border-b border-slate-100 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="border-b border-slate-100 px-5 py-5 lg:border-r lg:border-b-0">
                            <SectionTitle
                                title="Skill progress"
                                description="Reviewed writing and speaking signals on a 10-point scale."
                            />
                            <div className="mt-4">
                                {data.emptyStates.hasSkillData ? (
                                    <div className="space-y-4">
                                        {data.skills.map((skill) => (
                                            <div key={skill.skill}>
                                                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                                    <span className="font-medium text-slate-700">
                                                        {skill.skill}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {skill.scoreLabel ?? "No data"}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={skill.progress ?? 0}
                                                    className="h-1.5"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <ProfileEmptyState
                                        icon={Target}
                                        title="No reviewed skill data yet"
                                        description="Complete a reviewed writing or speaking session to unlock your skill breakdown."
                                        actions={[
                                            { href: "/writing", label: "Start writing" },
                                            { href: "/speaking", label: "Start speaking" },
                                        ]}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-5">
                            <SectionTitle
                                title="Learning snapshot"
                                description="Current account state and practice totals."
                            />
                            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                                <InfoLine
                                    icon={<PenLine className="size-4" />}
                                    label="Writing"
                                    value={formatPair(writingRows)}
                                />
                                <InfoLine
                                    icon={<Mic className="size-4" />}
                                    label="Speaking"
                                    value={formatPair(speakingRows)}
                                />
                                <InfoLine
                                    icon={<Flame className="size-4" />}
                                    label="Streak"
                                    value={`${data.stats.streak} days`}
                                />
                                <InfoLine
                                    icon={<Check className="size-4" />}
                                    label="Profile state"
                                    value={
                                        data.emptyStates.hasAnyActivity
                                            ? "Active learner"
                                            : "Just getting started"
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="px-5 py-5">
                        <SectionTitle
                            title="Achievements"
                            description="Milestones unlocked from real learning activity."
                        />
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {data.achievements.map((achievement) => {
                                const Icon =
                                    achievementIconMap[
                                        achievement.id as keyof typeof achievementIconMap
                                    ] ?? Star;

                                return (
                                    <div
                                        key={achievement.id}
                                        className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3"
                                    >
                                        <div
                                            className={
                                                achievement.earned
                                                    ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"
                                                    : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                                            }
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-slate-950">
                                                    {achievement.label}
                                                </p>
                                                <span className="text-xs text-slate-400">
                                                    {achievement.earned
                                                        ? "Unlocked"
                                                        : "Locked"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {achievement.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div>
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
    );
}

function MetricCell({
    label,
    value,
    detail,
    icon,
}: {
    label: string;
    value: string;
    detail: string;
    icon: ReactNode;
}) {
    return (
        <div className="border-b border-slate-200 p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-xs font-medium uppercase text-slate-400">
                    {label}
                </span>
            </div>
            <p className="truncate text-xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
    );
}

function InfoLine({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
            <div className="flex min-w-0 items-center gap-2 text-slate-500">
                {icon}
                <span className="truncate text-sm">{label}</span>
            </div>
            <span className="min-w-0 truncate text-right text-sm font-medium text-slate-950">
                {value}
            </span>
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
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                <Icon className="size-5" />
            </div>
            <p className="text-base font-medium text-slate-950">{title}</p>
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

function formatPair(rows: Array<{ label: string; value: string }>) {
    return rows.map((row) => `${row.value} ${row.label.toLowerCase()}`).join(" / ");
}
