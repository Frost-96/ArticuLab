"use client";

import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/stores/onboarding-store";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    MessageSquare,
    Mic,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const quickActions = [
    {
        label: "Start Writing Practice",
        description: "Dive into your first essay",
        icon: BookOpen,
        href: "/writing",
        color: "bg-indigo-100 text-indigo-600",
    },
    {
        label: "Try Speaking Practice",
        description: "Have a conversation with AI",
        icon: Mic,
        href: "/speaking",
        color: "bg-purple-100 text-purple-600",
    },
    {
        label: "Chat with AI Coach",
        description: "Ask any English question",
        icon: MessageSquare,
        href: "/coach",
        color: "bg-emerald-100 text-emerald-600",
    },
];

const levelLabel: Record<string, string> = {
    beginner: "Beginner (A1)",
    elementary: "Elementary (A2)",
    intermediate: "Intermediate (B1)",
    "upper-intermediate": "Upper Intermediate (B2)",
    advanced: "Advanced (C1-C2)",
    "not-sure": "Not Sure Yet",
};

const goalLabel: Record<string, string> = {
    "exam-prep": "Exam Preparation",
    academic: "Academic English",
    career: "Career & Professional",
    daily: "Daily Communication",
    immigration: "Immigration",
};

export function CompleteStep() {
    const router = useRouter();
    const { data } = useOnboardingStore();

    return (
        <div className="mx-auto max-w-lg text-center">
            <div className="relative mb-8 inline-flex">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                </div>
                <div className="absolute -right-2 -top-2">
                    <Sparkles className="h-8 w-8 text-amber-400" />
                </div>
            </div>

            <h2 className="mb-2 text-3xl font-bold text-slate-900">
                You&apos;re all set!
            </h2>
            <p className="mb-8 text-lg text-slate-500">
                Your personalized learning path is ready to go.
            </p>

            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Your Profile Summary
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 py-2">
                        <span className="text-sm text-slate-500">
                            English Level
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                            {data.englishLevel
                                ? levelLabel[data.englishLevel]
                                : "—"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-500">Goal</span>
                        <span className="text-sm font-medium text-slate-900">
                            {data.learningGoal
                                ? goalLabel[data.learningGoal]
                                : "—"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                    What would you like to do first?
                </p>
                {quickActions.map((action) => (
                    <button
                        key={action.href}
                        type="button"
                        onClick={() => router.push(action.href)}
                        className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-300 hover:shadow-md"
                    >
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}
                        >
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                                {action.label}
                            </p>
                            <p className="text-xs text-slate-500">
                                {action.description}
                            </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                    </button>
                ))}
            </div>

            <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
            >
                Go to Dashboard
            </Button>
        </div>
    );
}
