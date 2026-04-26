import type { EnglishLevel, LearningGoal } from "@/schema";

export type { EnglishLevel, LearningGoal };

export interface OnboardingData {
    englishLevel: EnglishLevel | null;
    learningGoal: LearningGoal | null;
}

export interface OnboardingStep {
    id: number;
    title: string;
    description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    { id: 0, title: "Welcome", description: "Let's get started" },
    { id: 1, title: "Your Level", description: "Current English level" },
    { id: 2, title: "Your Goal", description: "What do you want to achieve" },
    { id: 3, title: "All Set", description: "Ready to go" },
];
