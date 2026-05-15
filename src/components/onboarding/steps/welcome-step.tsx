"use client";

import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/stores/onboarding-store";
import {
    ArrowRight,
    BookOpen,
    MessageSquare,
    Mic,
    Sparkles,
    TrendingUp,
} from "lucide-react";

const features = [
    {
        icon: BookOpen,
        title: "Writing Practice",
        description: "AI-scored essays with detailed feedback",
        color: "bg-sky-100 text-sky-600",
    },
    {
        icon: Mic,
        title: "Speaking Practice",
        description: "Real conversation scenarios with AI",
        color: "bg-blue-100 text-blue-600",
    },
    {
        icon: MessageSquare,
        title: "AI Coach",
        description: "Personalized English help on demand",
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
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                <Sparkles className="h-8 w-8" />
            </div>

            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Welcome to ArticuLab
            </h1>
            <p className="mx-auto mb-10 max-w-md text-base leading-7 text-slate-500">
                Let&apos;s personalize your learning workspace. This takes about two
                minutes.
            </p>

            <div className="mx-auto mb-10 grid max-w-md grid-cols-2 gap-3">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div
                            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md ${feature.color}`}
                        >
                            <feature.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-950">
                            {feature.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-tight text-slate-500">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            <Button
                size="lg"
                onClick={nextStep}
                className="h-11 min-w-[200px] bg-sky-600 text-base hover:bg-sky-700"
            >
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="mt-4 text-xs text-slate-400">
                You can change these settings later.
            </p>
        </div>
    );
}
