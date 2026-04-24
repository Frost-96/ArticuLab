"use client";

import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ArrowRight, BookOpen, MessageSquare, Mic, TrendingUp } from "lucide-react";

const features = [
    {
        icon: BookOpen,
        title: "Writing Practice",
        description: "AI-scored essays with detailed feedback",
        color: "bg-indigo-100 text-indigo-600",
    },
    {
        icon: Mic,
        title: "Speaking Practice",
        description: "Real conversation scenarios with AI",
        color: "bg-purple-100 text-purple-600",
    },
    {
        icon: MessageSquare,
        title: "AI Coach",
        description: "24/7 personalized English tutor",
        color: "bg-emerald-100 text-emerald-600",
    },
    {
        icon: TrendingUp,
        title: "Progress Tracking",
        description: "See your improvement over time",
        color: "bg-amber-100 text-amber-600",
    },
];

export function WelcomeStep() {
    const { nextStep } = useOnboardingStore();

    return (
        <div className="text-center">
            <div className="mb-8 inline-flex">
                <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-lg shadow-indigo-200">
                        ✨
                    </div>
                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs text-white">
                        👋
                    </div>
                </div>
            </div>

            <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Welcome to ArticuLab!
            </h1>
            <p className="mx-auto mb-10 max-w-md text-lg text-slate-500">
                Let&apos;s personalize your learning experience. This will only
                take 2 minutes.
            </p>

            <div className="mx-auto mb-10 grid max-w-md grid-cols-2 gap-3">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div
                            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
                        >
                            <feature.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                            {feature.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-tight text-slate-400">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            <Button
                size="lg"
                onClick={nextStep}
                className="h-12 min-w-[200px] bg-indigo-600 text-base hover:bg-indigo-700"
            >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="mt-4 text-xs text-slate-400">
                You can change these settings later
            </p>
        </div>
    );
}
