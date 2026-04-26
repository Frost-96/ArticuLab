import { differenceInCalendarDays, startOfDay } from "date-fns";

type WritingSkillRecord = {
    grammarScore: number | null;
    vocabularyScore: number | null;
    coherenceScore: number | null;
    taskScore: number | null;
};

type SpeakingSkillRecord = {
    fluencyScore: number | null;
    accuracyScore: number | null;
};

export function calculateConsecutiveDays(activityDates: Date[]): number {
    if (activityDates.length === 0) {
        return 0;
    }

    const uniqueDays = Array.from(
        new Set(activityDates.map((date) => startOfDay(date).toISOString())),
    )
        .map((value) => new Date(value))
        .sort((left, right) => right.getTime() - left.getTime());

    const latest = uniqueDays[0];

    if (!latest) {
        return 0;
    }

    const gapFromToday = differenceInCalendarDays(startOfDay(new Date()), latest);

    if (gapFromToday > 1) {
        return 0;
    }

    let streak = 1;

    for (let index = 1; index < uniqueDays.length; index += 1) {
        const previous = uniqueDays[index - 1];
        const current = uniqueDays[index];

        if (
            !previous ||
            !current ||
            differenceInCalendarDays(previous, current) !== 1
        ) {
            break;
        }

        streak += 1;
    }

    return streak;
}

export function average(values: Array<number | null | undefined>): number | null {
    const filteredValues = values.filter(
        (value): value is number => typeof value === "number" && !Number.isNaN(value),
    );

    if (filteredValues.length === 0) {
        return null;
    }

    const total = filteredValues.reduce((sum, value) => sum + value, 0);
    return Number((total / filteredValues.length).toFixed(1));
}

export function normalizeWritingScoreToTen(score: number): number {
    return Number(((score / 9) * 10).toFixed(1));
}

export function buildSkillScores(
    writingRecords: WritingSkillRecord[],
    speakingRecords: SpeakingSkillRecord[],
) {
    const averageWritingGrammar = average(
        writingRecords.map((record) => record.grammarScore),
    );
    const averageWritingVocabulary = average(
        writingRecords.map((record) => record.vocabularyScore),
    );
    const averageWritingCoherence = average(
        writingRecords.map((record) => record.coherenceScore),
    );
    const averageWritingTask = average(
        writingRecords.map((record) => record.taskScore),
    );
    const averageSpeakingFluency = average(
        speakingRecords.map((record) => record.fluencyScore),
    );
    const averageSpeakingAccuracy = average(
        speakingRecords.map((record) => record.accuracyScore),
    );

    return [
        {
            skill: "Grammar" as const,
            score:
                averageWritingGrammar === null
                    ? null
                    : normalizeWritingScoreToTen(averageWritingGrammar),
        },
        {
            skill: "Vocabulary" as const,
            score:
                averageWritingVocabulary === null
                    ? null
                    : normalizeWritingScoreToTen(averageWritingVocabulary),
        },
        {
            skill: "Coherence" as const,
            score:
                averageWritingCoherence === null
                    ? null
                    : normalizeWritingScoreToTen(averageWritingCoherence),
        },
        {
            skill: "Task" as const,
            score:
                averageWritingTask === null
                    ? null
                    : normalizeWritingScoreToTen(averageWritingTask),
        },
        {
            skill: "Fluency" as const,
            score: averageSpeakingFluency,
        },
        {
            skill: "Accuracy" as const,
            score: averageSpeakingAccuracy,
        },
    ];
}
