"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSpeakingStore } from "@/stores/speakingStore";
import { useUIStore } from "@/stores/uiStore";
import { useWritingStore } from "@/stores/writingStore";
import {
    BookOpen,
    Clock,
    Crown,
    Flame,
    Mic,
    PenLine,
    Star,
    TrendingUp,
} from "lucide-react";

export default function Page() {
    const { user } = useUIStore();
    const { writingSessions } = useWritingStore();
    const { speakingSessions } = useSpeakingStore();

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    const reviewedWriting = writingSessions.filter(
        (s) => s.status === "reviewed",
    ).length;
    const totalWords = writingSessions.reduce((sum, s) => sum + s.wordCount, 0);
    const completedSpeaking = speakingSessions.filter(
        (s) => s.status === "completed",
    ).length;
    const avgFluency =
        speakingSessions
            .filter((s) => s.fluencyScore != null)
            .reduce((sum, s) => sum + (s.fluencyScore ?? 0), 0) /
        (speakingSessions.filter((s) => s.fluencyScore != null).length || 1);

    const studyHours = Math.floor(user.studyTime / 60);
    const studyMins = user.studyTime % 60;

    const badges = [
        {
            label: "First Essay",
            icon: PenLine,
            color: "bg-indigo-100 text-indigo-700",
            earned: writingSessions.length > 0,
        },
        {
            label: "7-Day Streak",
            icon: Flame,
            color: "bg-amber-100 text-amber-700",
            earned: user.streak >= 7,
        },
        {
            label: "Pro Member",
            icon: Crown,
            color: "bg-purple-100 text-purple-700",
            earned: user.plan === "pro",
        },
        {
            label: "Speaking Star",
            icon: Star,
            color: "bg-emerald-100 text-emerald-700",
            earned: completedSpeaking >= 3,
        },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    {user.name}
                                </h1>
                                {user.plan === "pro" ? (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Pro
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Free</Badge>
                                )}
                            </div>
                            <p className="text-slate-500 mt-0.5">
                                {user.email}
                            </p>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Flame className="h-4 w-4 text-amber-500" />
                                    <span className="font-semibold text-slate-900">
                                        {user.streak}
                                    </span>{" "}
                                    day streak
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <BookOpen className="h-4 w-4 text-indigo-500" />
                                    <span className="font-semibold text-slate-900">
                                        {user.totalSessions}
                                    </span>{" "}
                                    sessions
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Clock className="h-4 w-4 text-purple-500" />
                                    <span className="font-semibold text-slate-900">
                                        {studyHours}h {studyMins}m
                                    </span>{" "}
                                    studied
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            Edit Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: "Words Written",
                        value: totalWords.toLocaleString(),
                        icon: PenLine,
                        iconBg: "bg-indigo-100",
                        iconColor: "text-indigo-600",
                    },
                    {
                        label: "Essays Reviewed",
                        value: reviewedWriting,
                        icon: TrendingUp,
                        iconBg: "bg-emerald-100",
                        iconColor: "text-emerald-600",
                    },
                    {
                        label: "Speaking Sessions",
                        value: completedSpeaking,
                        icon: Mic,
                        iconBg: "bg-purple-100",
                        iconColor: "text-purple-600",
                    },
                    {
                        label: "Avg Fluency",
                        value:
                            avgFluency > 0 ? `${Math.round(avgFluency)}%` : "—",
                        icon: Star,
                        iconBg: "bg-amber-100",
                        iconColor: "text-amber-600",
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <div
                                className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}
                            >
                                <stat.icon
                                    className={`h-4 w-4 ${stat.iconColor}`}
                                />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {stat.value}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {stat.label}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Skill Progress */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Skill Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: "Grammar", value: 82 },
                        { label: "Vocabulary", value: 75 },
                        { label: "Coherence", value: 88 },
                        { label: "Fluency", value: 65 },
                        { label: "Pronunciation", value: 78 },
                    ].map((skill) => (
                        <div key={skill.label}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-slate-700">
                                    {skill.label}
                                </span>
                                <span className="font-medium text-slate-900">
                                    {skill.value}%
                                </span>
                            </div>
                            <Progress value={skill.value} className="h-2" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Badges */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {badges.map((badge) => (
                            <div
                                key={badge.label}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-opacity ${
                                    badge.earned
                                        ? "border-slate-200 opacity-100"
                                        : "border-slate-100 opacity-40"
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center`}
                                >
                                    <badge.icon className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-medium text-slate-700 text-center">
                                    {badge.label}
                                </p>
                                {!badge.earned && (
                                    <p className="text-xs text-slate-400">
                                        Locked
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
