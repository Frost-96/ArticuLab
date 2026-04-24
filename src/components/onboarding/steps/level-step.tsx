"use client";

import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { EnglishLevel } from "@/types/onboarding";
import { Check } from "lucide-react";

const levels: {
    value: EnglishLevel;
    label: string;
    cefr: string;
    description: string;
    emoji: string;
    examples: string;
}[] = [
    {
        value: "beginner",
        label: "Beginner",
        cefr: "A1",
        description: "I can use simple phrases and introduce myself",
        emoji: "🌱",
        examples: "Hello, my name is..., I like...",
    },
    {
        value: "elementary",
        label: "Elementary",
        cefr: "A2",
        description: "I can handle simple conversations on familiar topics",
        emoji: "🌿",
        examples: "Basic shopping, simple directions, daily routines",
    },
    {
        value: "intermediate",
        label: "Intermediate",
        cefr: "B1",
        description: "I can deal with most everyday situations",
        emoji: "🌳",
        examples: "Travel, opinions, work emails",
    },
    {
        value: "upper-intermediate",
        label: "Upper Intermediate",
        cefr: "B2",
        description: "I can interact fluently with native speakers",
        emoji: "🏔️",
        examples: "Debates, complex texts, professional writing",
    },
    {
        value: "advanced",
        label: "Advanced",
        cefr: "C1-C2",
        description: "I can express myself fluently and precisely",
        emoji: "⭐",
        examples: "Academic writing, nuanced arguments, idioms",
    },
    {
        value: "not-sure",
        label: "Not Sure",
        cefr: "—",
        description: "Help me figure out my level",
        emoji: "🤔",
        examples: "We will calibrate difficulty as you practice",
    },
];

export function LevelStep() {
    const { data, setEnglishLevel } = useOnboardingStore();

    return (
        <div>
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                    What&apos;s your English level?
                </h2>
                <p className="mx-auto max-w-md text-slate-500">
                    This helps us customize content difficulty and provide the
                    right feedback for you.
                </p>
            </div>

            <div className="mx-auto grid max-w-xl gap-3">
                {levels.map((level) => {
                    const isSelected = data.englishLevel === level.value;

                    return (
                        <button
                            key={level.value}
                            type="button"
                            onClick={() => setEnglishLevel(level.value)}
                            className={cn(
                                "relative w-full rounded-xl border-2 bg-white p-4 text-left transition-all duration-200 hover:border-indigo-200 hover:shadow-md",
                                isSelected &&
                                    "border-indigo-500 bg-indigo-50 shadow-md",
                                !isSelected && "border-slate-200",
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 shrink-0 text-2xl">
                                    {level.emoji}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "font-semibold",
                                                isSelected
                                                    ? "text-indigo-700"
                                                    : "text-slate-900",
                                            )}
                                        >
                                            {level.label}
                                        </span>
                                        {level.cefr !== "—" && (
                                            <span
                                                className={cn(
                                                    "rounded px-1.5 py-0.5 text-xs font-medium",
                                                    isSelected
                                                        ? "bg-indigo-200 text-indigo-700"
                                                        : "bg-slate-100 text-slate-500",
                                                )}
                                            >
                                                CEFR {level.cefr}
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={cn(
                                            "mb-1 text-sm",
                                            isSelected
                                                ? "text-indigo-600"
                                                : "text-slate-600",
                                        )}
                                    >
                                        {level.description}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {level.examples}
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                        isSelected
                                            ? "border-indigo-500 bg-indigo-500"
                                            : "border-slate-300",
                                    )}
                                >
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-white" />
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
