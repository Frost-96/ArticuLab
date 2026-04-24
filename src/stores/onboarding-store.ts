import { create } from "zustand";
import type { EnglishLevel, LearningGoal, OnboardingData } from "@/types/onboarding";

interface OnboardingState {
    currentStep: number;
    totalSteps: number;
    data: OnboardingData;
    isSubmitting: boolean;
    initialize: (data?: Partial<OnboardingData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    setEnglishLevel: (level: EnglishLevel) => void;
    setLearningGoal: (goal: LearningGoal) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    canProceed: () => boolean;
    resetOnboarding: () => void;
}

const initialData: OnboardingData = {
    englishLevel: null,
    learningGoal: null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    currentStep: 0,
    totalSteps: 4,
    data: { ...initialData },
    isSubmitting: false,
    initialize: (data) =>
        set({
            currentStep: 0,
            isSubmitting: false,
            data: {
                englishLevel: data?.englishLevel ?? null,
                learningGoal: data?.learningGoal ?? null,
            },
        }),
    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),
    prevStep: () =>
        set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 0),
        })),
    goToStep: (step) =>
        set((state) => ({
            currentStep: Math.max(0, Math.min(step, state.totalSteps - 1)),
        })),
    setEnglishLevel: (level) =>
        set((state) => ({
            data: {
                ...state.data,
                englishLevel: level,
            },
        })),
    setLearningGoal: (goal) =>
        set((state) => ({
            data: {
                ...state.data,
                learningGoal: goal,
            },
        })),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    canProceed: () => {
        const { currentStep, data } = get();

        switch (currentStep) {
            case 0:
                return true;
            case 1:
                return data.englishLevel !== null;
            case 2:
                return data.learningGoal !== null;
            default:
                return true;
        }
    },
    resetOnboarding: () =>
        set({
            currentStep: 0,
            totalSteps: 4,
            data: { ...initialData },
            isSubmitting: false,
        }),
}));
