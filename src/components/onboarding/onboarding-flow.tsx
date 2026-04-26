"use client";

import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/server/actions/auth.action";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { EnglishLevel } from "@/types/onboarding";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { StepIndicator } from "./step-indicator";
import { CompleteStep } from "./steps/complete-step";
import { GoalStep } from "./steps/goal-step";
import { LevelStep } from "./steps/level-step";
import { WelcomeStep } from "./steps/welcome-step";

const stepComponents = [WelcomeStep, LevelStep, GoalStep, CompleteStep];

interface OnboardingFlowProps {
    initialEnglishLevel?: EnglishLevel | null;
}

export function OnboardingFlow({
    initialEnglishLevel = null,
}: OnboardingFlowProps) {
    const {
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        canProceed,
        isSubmitting,
        data,
        initialize,
        setIsSubmitting,
    } = useOnboardingStore();

    useEffect(() => {
        initialize({ englishLevel: initialEnglishLevel });
    }, [initialEnglishLevel, initialize]);

    const CurrentStepComponent = stepComponents[currentStep]!;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const isGoalStep = currentStep === totalSteps - 2;
    const showNavigation = !isFirstStep && !isLastStep;

    async function handleNext() {
        if (!canProceed() || isSubmitting) {
            return;
        }

        if (!isGoalStep) {
            nextStep();
            return;
        }

        if (!data.englishLevel || !data.learningGoal) {
            return;
        }

        setIsSubmitting(true);

        const result = await completeOnboarding({
            englishLevel: data.englishLevel,
            learningGoal: data.learningGoal,
        });

        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("Your profile is ready");
        nextStep();
    }

    return (
        <div className="flex min-h-[calc(100vh-96px)] flex-col">
            {showNavigation && (
                <div className="px-4 pb-4 pt-8">
                    <StepIndicator currentStep={currentStep} />
                </div>
            )}

            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-2xl animate-slide-up-fade">
                    <CurrentStepComponent />
                </div>
            </div>

            {showNavigation && (
                <div className="sticky bottom-0 border-t border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-2xl items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            className="text-slate-600"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!canProceed() || isSubmitting}
                            className="min-w-[140px] bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting up...
                                </>
                            ) : isGoalStep ? (
                                <>
                                    Complete Setup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}
