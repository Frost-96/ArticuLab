import { differenceInCalendarDays, startOfDay } from "date-fns";
import { normalizeToTen } from "@/lib/writing/scoreScale";
import type { WritingScenarioType } from "@/schema";

type WritingSkillRecord = {
  scenarioType: WritingScenarioType;
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

export function average(
  values: Array<number | null | undefined>,
): number | null {
  const filteredValues = values.filter(
    (value): value is number =>
      typeof value === "number" && !Number.isNaN(value),
  );

  if (filteredValues.length === 0) {
    return null;
  }

  const total = filteredValues.reduce((sum, value) => sum + value, 0);
  return Number((total / filteredValues.length).toFixed(1));
}

/**
 * 将单条写作记录的分数归一化到 0-10
 * 先按 scenarioType 归一化到 0-10，再返回
 */
function normalizeRecordScores(record: WritingSkillRecord) {
  const t = record.scenarioType;
  return {
    grammar:
      record.grammarScore !== null
        ? normalizeToTen(record.grammarScore, t)
        : null,
    vocabulary:
      record.vocabularyScore !== null
        ? normalizeToTen(record.vocabularyScore, t)
        : null,
    coherence:
      record.coherenceScore !== null
        ? normalizeToTen(record.coherenceScore, t)
        : null,
    task:
      record.taskScore !== null ? normalizeToTen(record.taskScore, t) : null,
  };
}

/**
 * 构建技能雷达图数据
 * 先将每条写作记录归一化到 0-10，再计算平均值（跨考试类型可比较）
 */
export function buildSkillScores(
  writingRecords: WritingSkillRecord[],
  speakingRecords: SpeakingSkillRecord[],
) {
  // 先归一化每条记录到 0-10，再求平均（不同考试类型的分数才能正确混合）
  const normalized = writingRecords.map(normalizeRecordScores);

  const averageWritingGrammar = average(normalized.map((r) => r.grammar));
  const averageWritingVocabulary = average(normalized.map((r) => r.vocabulary));
  const averageWritingCoherence = average(normalized.map((r) => r.coherence));
  const averageWritingTask = average(normalized.map((r) => r.task));
  const averageSpeakingFluency = average(
    speakingRecords.map((record) => record.fluencyScore),
  );
  const averageSpeakingAccuracy = average(
    speakingRecords.map((record) => record.accuracyScore),
  );

  return [
    { skill: "Grammar" as const, score: averageWritingGrammar },
    { skill: "Vocabulary" as const, score: averageWritingVocabulary },
    { skill: "Coherence" as const, score: averageWritingCoherence },
    { skill: "Task" as const, score: averageWritingTask },
    { skill: "Fluency" as const, score: averageSpeakingFluency },
    { skill: "Accuracy" as const, score: averageSpeakingAccuracy },
  ];
}
