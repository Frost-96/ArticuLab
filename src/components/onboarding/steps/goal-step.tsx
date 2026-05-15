"use client";

import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { LearningGoal } from "@/types/onboarding";
import {
    BookOpen,
    Briefcase,
    Check,
    Coffee,
    GraduationCap,
    Plane,
} from "lucide-react";
import type { ComponentType } from "react";

const goals: {
    value: LearningGoal;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    color: string;
}[] = [
    {
        value: "exam-prep",
        label: "Exam Preparation",
        description: "Preparing for IELTS, TOEFL, PTE, or other English exams",
        icon: GraduationCap,
        color: "bg-sky-100 text-sky-600",
    },
    {
        value: "academic",
        label: "Academic English",
        description: "University studies, research papers, and presentations",
        icon: BookOpen,
        color: "bg-blue-100 text-blue-600",
    },
    {
        value: "career",
        label: "Career & Professional",
        description: "Job interviews, workplace communication, and emails",
        icon: Briefcase,
        color: "bg-emerald-100 text-emerald-600",
    },
    {
        value: "daily",
        label: "Daily Communication",
        description: "Everyday conversations, social situations, and travel",
        icon: Coffee,
        color: "bg-amber-100 text-amber-600",
    },
    {
        value: "immigration",
        label: "Immigration",
        description: "Language requirements for visa or permanent residency",
        icon: Plane,
        color: "bg-rose-100 text-rose-600",
    },
];

export function GoalStep() {
    const { data, setLearningGoal } = useOnboardingStore();

    return (
        <div>
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    What&apos;s your main goal?
                </h2>
                <p className="mx-auto max-w-md text-slate-500">
                    Pick the one that matters most right now. We&apos;ll tailor
                    your first experience around it.
                </p>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {goals.map((goal) => {
                    const isSelected = data.learningGoal === goal.value;

                    return (
                        <button
                            key={goal.value}
                            type="button"
                            onClick={() => setLearningGoal(goal.value)}
                            className={cn(
                                "relative rounded-lg border bg-white p-5 text-left transition-colors",
                                isSelected
                                    ? "border-sky-500 bg-sky-50"
                                    : "border-slate-200 hover:border-sky-200",
                            )}
                        >
                            <div
                                className={cn(
                                    "mb-3 flex h-11 w-11 items-center justify-center rounded-md",
                                    isSelected ? "bg-sky-100" : goal.color,
                                )}
                            >
                                <goal.icon
                                    className={cn(
                                        "h-5 w-5",
                                        isSelected
                                            ? "text-sky-600"
                                            : goal.color.split(" ")[1],
                                    )}
                                />
                            </div>

                            <h3
                                className={cn(
                                    "mb-1 font-semibold",
                                    isSelected
                                        ? "text-sky-700"
                                        : "text-slate-900",
                                )}
                            >
                                {goal.label}
                            </h3>
                            <p className="pr-6 text-sm leading-snug text-slate-500">
                                {goal.description}
                            </p>

                            <div
                                className={cn(
                                    "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                                    isSelected
                                        ? "border-sky-500 bg-sky-500"
                                        : "border-slate-300",
                                )}
                            >
                                {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
