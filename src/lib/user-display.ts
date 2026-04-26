import type { EnglishLevel, LearningGoal } from "@/schema";

const ENGLISH_LEVEL_LABELS: Record<EnglishLevel, string> = {
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
    "upper-intermediate": "Upper Intermediate",
    advanced: "Advanced",
    "not-sure": "Not Sure Yet",
};

const LEARNING_GOAL_LABELS: Record<LearningGoal, string> = {
    "exam-prep": "Exam Preparation",
    academic: "Academic English",
    career: "Career & Professional",
    daily: "Daily Communication",
    immigration: "Immigration",
};

export function formatEnglishLevel(
    level: EnglishLevel | null | undefined,
): string | null {
    if (!level) {
        return null;
    }

    return ENGLISH_LEVEL_LABELS[level] ?? null;
}

export function formatLearningGoal(
    goal: LearningGoal | null | undefined,
): string | null {
    if (!goal) {
        return null;
    }

    return LEARNING_GOAL_LABELS[goal] ?? null;
}

export function getDisplayName(
    name: string | null | undefined,
    email: string,
): string {
    return name?.trim() || email.split("@")[0] || "Learner";
}

export function getInitials(value: string): string {
    return (
        value
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U"
    );
}
