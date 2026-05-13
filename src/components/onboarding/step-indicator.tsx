"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { Check } from "lucide-react";
import React from "react";

interface StepIndicatorProps {
    currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    const displaySteps = ONBOARDING_STEPS.filter(
        (step) => step.id > 0 && step.id < ONBOARDING_STEPS.length - 1,
    );
    const completedSteps = Math.min(currentStep, displaySteps.length);
    const progressValue = (completedSteps / displaySteps.length) * 100;

    return (
        <div className="w-full">
            <div className="px-4 sm:hidden">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        Step {completedSteps} of {displaySteps.length}
                    </span>
                    <span className="font-medium text-sky-600">
                        {Math.round(progressValue)}%
                    </span>
                </div>
                <Progress value={progressValue} className="h-2 bg-slate-200" />
            </div>

            <div className="hidden sm:block">
                <div className="flex items-center justify-center">
                    {displaySteps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const isUpcoming = currentStep < step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="relative flex flex-col items-center">
                                    <div
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                                            isCompleted && "bg-sky-600 text-white",
                                            isCurrent &&
                                                "bg-sky-600 text-white ring-4 ring-sky-100",
                                            isUpcoming && "bg-slate-200 text-slate-500",
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "absolute -bottom-6 whitespace-nowrap text-xs transition-colors",
                                            isCurrent
                                                ? "font-medium text-sky-600"
                                                : "text-slate-400",
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </div>

                                {index < displaySteps.length - 1 && (
                                    <div className="mx-1 h-0.5 w-16 lg:w-24">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                currentStep > step.id + 1
                                                    ? "bg-sky-600"
                                                    : currentStep > step.id
                                                      ? "bg-sky-300"
                                                      : "bg-slate-200",
                                            )}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
