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
    examples: string;
}[] = [
    {
        value: "beginner",
        label: "Beginner",
        cefr: "A1",
        description: "I can use simple phrases and introduce myself.",
        examples: "Basic greetings, preferences, and short answers",
    },
    {
        value: "elementary",
        label: "Elementary",
        cefr: "A2",
        description: "I can handle simple conversations on familiar topics.",
        examples: "Shopping, directions, routines, and simple messages",
    },
    {
        value: "intermediate",
        label: "Intermediate",
        cefr: "B1",
        description: "I can deal with most everyday situations.",
        examples: "Travel, opinions, work emails, and short essays",
    },
    {
        value: "upper-intermediate",
        label: "Upper Intermediate",
        cefr: "B2",
        description: "I can interact fluently with native speakers.",
        examples: "Debates, complex texts, and professional writing",
    },
    {
        value: "advanced",
        label: "Advanced",
        cefr: "C1-C2",
        description: "I can express myself fluently and precisely.",
        examples: "Academic writing, nuanced arguments, and idioms",
    },
    {
        value: "not-sure",
        label: "Not Sure",
        cefr: "Auto",
        description: "Help me calibrate my level as I practice.",
        examples: "ArticuLab will adjust difficulty from early sessions",
    },
];

export function LevelStep() {
    const { data, setEnglishLevel } = useOnboardingStore();

    return (
        <div>
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    What&apos;s your English level?
                </h2>
                <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">
                    This helps us customize prompt difficulty and feedback depth.
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
                                "relative w-full rounded-lg border bg-white p-4 text-left transition-colors hover:border-sky-200",
                                isSelected
                                    ? "border-sky-500 bg-sky-50"
                                    : "border-slate-200",
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                                    {level.cefr}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            "font-semibold",
                                            isSelected
                                                ? "text-sky-700"
                                                : "text-slate-950",
                                        )}
                                    >
                                        {level.label}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        {level.description}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {level.examples}
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                        isSelected
                                            ? "border-sky-600 bg-sky-600"
                                            : "border-slate-300",
                                    )}
                                >
                                    {isSelected ? (
                                        <Check className="h-3 w-3 text-white" />
                                    ) : null}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
