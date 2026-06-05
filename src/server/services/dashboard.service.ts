import { format, formatDistanceToNow, startOfWeek, subWeeks } from "date-fns";
import {
  dashboardDataSchema,
  type DashboardData,
  englishLevelEnum,
  membershipTierEnum,
  speakingReviewResultSchema,
  writingReviewResultSchema,
} from "@/schema";
import type { WritingScenarioType } from "@/schema/enums";
import { formatEnglishLevel, getDisplayName } from "@/lib/user-display";
import { formatScore, normalizeToTen } from "@/lib/writing/scoreScale";
import { getDashboardSourceData } from "@/server/repositories/dashboard.repository";
import {
  average,
  buildSkillScores,
  calculateConsecutiveDays,
} from "@/server/services/learning-metrics";

type GetDashboardDataOptions = {
  trendWeeks?: number;
  analysisRecentCount?: number;
  recentActivityLimit?: number;
  weaknessTopN?: number;
};

type WeaknessAccumulator = {
  category: string;
  description: string;
  frequency: number;
  suggestion: string;
};

const DEFAULT_OPTIONS = {
  trendWeeks: 8,
  analysisRecentCount: 10,
  recentActivityLimit: 5,
  weaknessTopN: 3,
} satisfies Required<GetDashboardDataOptions>;

export async function getDashboardData(
  userId: string,
  options: GetDashboardDataOptions = {},
): Promise<DashboardData> {
  const resolvedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const trendStartDate = startOfWeek(
    subWeeks(new Date(), resolvedOptions.trendWeeks - 1),
    { weekStartsOn: 1 },
  );

  const source = await getDashboardSourceData(userId, {
    analysisRecentCount: resolvedOptions.analysisRecentCount,
    recentActivityLimit: resolvedOptions.recentActivityLimit,
    trendStartDate,
  });

  if (!source.user) {
    throw new Error("Dashboard user not found");
  }

  const displayName = getDisplayName(source.user.name, source.user.email);
  const parsedEnglishLevel = englishLevelEnum.safeParse(
    source.user.englishLevel,
  );
  const englishLevel = parsedEnglishLevel.success
    ? parsedEnglishLevel.data
    : null;
  const parsedMembershipTier = membershipTierEnum.safeParse(
    source.user.membershipTier,
  );
  const membershipTier = parsedMembershipTier.success
    ? parsedMembershipTier.data
    : "free";
  const englishLevelLabel = formatEnglishLevel(englishLevel);
  const consecutiveDays = calculateConsecutiveDays([
    ...source.writingActivityDates.map((item) => item.createdAt),
    ...source.speakingActivityDates.map((item) => item.createdAt),
    ...source.coachActivityDates.map((item) => item.createdAt),
  ]);

  const radar = buildSkillScores(
    source.reviewedWritingExercises as Array<{
      scenarioType: WritingScenarioType;
      grammarScore: number | null;
      vocabularyScore: number | null;
      coherenceScore: number | null;
      taskScore: number | null;
    }>,
    source.reviewedSpeakingExercises,
  );
  const trend = buildTrendData(
    source.trendWritingExercises,
    source.trendSpeakingExercises,
    resolvedOptions.trendWeeks,
  );
  const weaknesses = extractWeaknesses(
    source.reviewedWritingExercises,
    source.reviewedSpeakingExercises,
    resolvedOptions.weaknessTopN,
  );
  const recentActivities = buildRecentActivities(
    source.recentWritingExercises,
    source.recentSpeakingExercises,
    source.recentCoachConversations,
    resolvedOptions.recentActivityLimit,
  );
  const continueItems = buildContinueItems(
    source.recentWritingExercises,
    source.recentSpeakingExercises,
    source.recentCoachConversations,
  );

  return dashboardDataSchema.parse({
    header: {
      displayName,
      membershipTier,
      englishLevel,
      englishLevelLabel,
    },
    stats: {
      totalSessions:
        source.writingCount +
        source.speakingCount +
        source.coachConversationCount,
      recordedPracticeMinutes: Math.floor(source.speakingDurationSeconds / 60),
      consecutiveDays,
      writingCount: source.writingCount,
      speakingCount: source.speakingCount,
      coachChatCount: source.coachConversationCount,
      englishLevel,
      englishLevelLabel,
    },
    radar,
    trend,
    weaknesses,
    recentActivities,
    continueItems,
    emptyStates: {
      hasAnyActivity:
        source.writingCount > 0 ||
        source.speakingCount > 0 ||
        source.coachConversationCount > 0,
      hasWritingData: source.reviewedWritingExercises.length > 0,
      hasSpeakingData: source.reviewedSpeakingExercises.length > 0,
      hasFullRadarData:
        source.reviewedWritingExercises.length > 0 &&
        source.reviewedSpeakingExercises.length > 0,
      hasTrendData: trend.some(
        (point) => point.writingScore !== null || point.speakingScore !== null,
      ),
      hasWeaknessData: weaknesses.length > 0,
    },
  });
}

function buildTrendData(
  writingRecords: Array<{
    createdAt: Date;
    scenarioType: string;
    overallScore: number | null;
  }>,
  speakingRecords: Array<{
    createdAt: Date;
    fluencyScore: number | null;
  }>,
  trendWeeks: number,
) {
  const weekStarts = Array.from({ length: trendWeeks }, (_, index) =>
    startOfWeek(subWeeks(new Date(), trendWeeks - index - 1), {
      weekStartsOn: 1,
    }),
  );

  return weekStarts.map((weekStart) => {
    const weekKey = startOfWeek(weekStart, {
      weekStartsOn: 1,
    }).toISOString();

    const writingScores = writingRecords
      .filter(
        (record) =>
          startOfWeek(record.createdAt, { weekStartsOn: 1 }).toISOString() ===
          weekKey,
      )
      .map((record) =>
        record.overallScore !== null
          ? normalizeToTen(
              record.overallScore,
              record.scenarioType as WritingScenarioType,
            )
          : null,
      );

    const speakingScores = speakingRecords
      .filter(
        (record) =>
          startOfWeek(record.createdAt, { weekStartsOn: 1 }).toISOString() ===
          weekKey,
      )
      .map((record) => record.fluencyScore);

    return {
      label: format(weekStart, "MMM d"),
      writingScore: average(writingScores),
      speakingScore: average(speakingScores),
    };
  });
}

function extractWeaknesses(
  writingRecords: Array<{
    feedback: unknown;
  }>,
  speakingRecords: Array<{
    feedback: unknown;
  }>,
  topN: number,
) {
  const weaknessMap = new Map<string, WeaknessAccumulator>();

  for (const record of writingRecords) {
    const parsedFeedback = writingReviewResultSchema.safeParse(record.feedback);

    if (!parsedFeedback.success) {
      continue;
    }

    for (const sentenceFeedback of parsedFeedback.data.sentenceFeedback) {
      const category = normalizeWeaknessCategory(sentenceFeedback.category);

      upsertWeakness(weaknessMap, {
        category,
        description: sentenceFeedback.explanation,
        suggestion:
          sentenceFeedback.alternatives?.[0] ??
          parsedFeedback.data.improvements[0] ??
          "Review similar writing feedback and practice another essay.",
      });
    }
  }

  for (const record of speakingRecords) {
    const parsedFeedback = speakingReviewResultSchema.safeParse(
      record.feedback,
    );

    if (!parsedFeedback.success) {
      continue;
    }

    if (parsedFeedback.data.grammarErrors.length > 0) {
      upsertWeakness(weaknessMap, {
        category: "Grammar",
        description:
          parsedFeedback.data.grammarErrors[0]?.explanation ??
          "Grammar corrections appeared in recent speaking reviews.",
        suggestion:
          parsedFeedback.data.grammarErrors[0]?.corrected ??
          "Practice one more speaking review and focus on grammar accuracy.",
      });
    }

    if (parsedFeedback.data.vocabularyAnalysis.suggestedVocabulary.length > 0) {
      const firstSuggestion =
        parsedFeedback.data.vocabularyAnalysis.suggestedVocabulary[0];

      upsertWeakness(weaknessMap, {
        category: "Vocabulary",
        description:
          firstSuggestion?.definition ??
          "Expand your speaking vocabulary range with more precise words.",
        suggestion:
          firstSuggestion?.word ??
          "Practice using stronger vocabulary in speaking scenarios.",
      });
    }

    if (parsedFeedback.data.expressionSuggestions.length > 0) {
      const firstSuggestion = parsedFeedback.data.expressionSuggestions[0];

      upsertWeakness(weaknessMap, {
        category: "Fluency & Expression",
        description:
          firstSuggestion?.explanation ??
          "Recent speaking feedback suggests polishing expression choices.",
        suggestion:
          firstSuggestion?.improved ??
          "Practice one more speaking review to improve expression flow.",
      });
    }

    for (const improvement of parsedFeedback.data.improvements) {
      upsertWeakness(weaknessMap, {
        category: "Speaking",
        description: improvement,
        suggestion:
          "Open speaking practice and focus on this point in your next session.",
      });
    }
  }

  return Array.from(weaknessMap.values())
    .sort((left, right) => right.frequency - left.frequency)
    .slice(0, topN)
    .map((item) => ({
      category: item.category,
      description: item.description,
      frequency: item.frequency,
      suggestion: item.suggestion,
      href: getWeaknessHref(item.category),
    }));
}

function buildRecentActivities(
  writingRecords: Array<{
    id: string;
    prompt: string;
    scenarioType: string;
    overallScore: number | null;
    createdAt: Date;
    scenario: { title: string } | null;
    status: string;
  }>,
  speakingRecords: Array<{
    id: string;
    scenarioRole: string;
    fluencyScore: number | null;
    createdAt: Date;
    scenario: { title: string } | null;
    conversation: { title: string | null } | null;
    status: string;
  }>,
  coachConversations: Array<{
    id: string;
    title: string | null;
    updatedAt: Date;
    createdAt: Date;
  }>,
  limit: number,
) {
  const writingActivities = writingRecords.map((record) => ({
    id: record.id,
    type: "writing" as const,
    title:
      record.scenario?.title ??
      truncate(record.prompt, 48) ??
      "Writing Practice",
    subtitle: truncate(record.prompt, 80),
    score:
      record.overallScore === null
        ? null
        : normalizeToTen(
            record.overallScore,
            record.scenarioType as WritingScenarioType,
          ),
    scoreLabel:
      record.overallScore === null
        ? null
        : formatScore(
            record.overallScore,
            record.scenarioType as WritingScenarioType,
          ),
    createdAt: record.createdAt,
    href:
      record.status === "reviewed"
        ? `/writing/${record.id}/review`
        : `/writing/${record.id}`,
  }));

  const speakingActivities = speakingRecords.map((record) => ({
    id: record.id,
    type: "speaking" as const,
    title:
      record.conversation?.title ??
      record.scenario?.title ??
      record.scenarioRole,
    subtitle: record.scenarioRole || "Speaking practice",
    score: record.fluencyScore,
    scoreLabel:
      record.fluencyScore === null ? null : record.fluencyScore.toFixed(1),
    createdAt: record.createdAt,
    href:
      record.status === "reviewed"
        ? `/speaking/${record.id}/review`
        : `/speaking/${record.id}`,
  }));

  const coachActivities = coachConversations.map((record) => ({
    id: record.id,
    type: "coach" as const,
    title: record.title?.trim() || "AI Coach Session",
    subtitle: "Grammar, vocabulary, and feedback help",
    score: null,
    scoreLabel: null,
    createdAt: record.createdAt,
    href: "/coach",
  }));

  return [...writingActivities, ...speakingActivities, ...coachActivities]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit)
    .map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      subtitle: activity.subtitle,
      score: activity.score,
      scoreLabel: activity.scoreLabel,
      timeLabel: formatDistanceToNow(activity.createdAt, {
        addSuffix: true,
      }),
      href: activity.href,
    }));
}

function buildContinueItems(
  writingRecords: Array<{
    id: string;
    prompt: string;
    wordCount: number;
    overallScore: number | null;
    updatedAt?: Date;
    createdAt: Date;
    scenario: { title: string } | null;
    status: string;
  }>,
  speakingRecords: Array<{
    id: string;
    scenarioRole: string;
    status: string;
    totalTurns: number | null;
    updatedAt?: Date;
    createdAt: Date;
    scenario: { title: string } | null;
    conversation: { title: string | null } | null;
  }>,
  coachConversations: Array<{
    id: string;
    title: string | null;
    updatedAt: Date;
    createdAt: Date;
  }>,
) {
  const writingItems = writingRecords
    .filter((record) => record.status !== "reviewed")
    .map((record) => ({
      id: record.id,
      type: "writing" as const,
      title:
        record.scenario?.title ??
        truncate(record.prompt, 56) ??
        "Writing Draft",
      subtitle: `${record.wordCount} words`,
      statusLabel: formatStatusLabel(record.status),
      date: record.updatedAt ?? record.createdAt,
      href: `/writing/${record.id}`,
    }));

  const speakingItems = speakingRecords
    .filter((record) => record.status === "in_progress")
    .map((record) => ({
      id: record.id,
      type: "speaking" as const,
      title:
        record.conversation?.title ??
        record.scenario?.title ??
        record.scenarioRole,
      subtitle: `${record.totalTurns ?? 0} turns`,
      statusLabel: "In progress",
      date: record.updatedAt ?? record.createdAt,
      href: `/speaking/${record.id}`,
    }));

  const coachItems = coachConversations.slice(0, 1).map((record) => ({
    id: record.id,
    type: "coach" as const,
    title: record.title?.trim() || "AI Coach Session",
    subtitle: "Continue the conversation",
    statusLabel: "Recent coach chat",
    date: record.updatedAt,
    href: `/coach?id=${record.id}`,
  }));

  return [...writingItems, ...speakingItems, ...coachItems]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      statusLabel: item.statusLabel,
      timeLabel: formatDistanceToNow(item.date, { addSuffix: true }),
      href: item.href,
    }));
}

function normalizeWeaknessCategory(category: string): string {
  const normalized = category.trim().toLowerCase();

  switch (normalized) {
    case "grammar":
      return "Grammar";
    case "vocabulary":
      return "Vocabulary";
    case "coherence":
      return "Coherence";
    case "task":
    case "task response":
    case "task achievement":
      return "Task Response";
    case "fluency":
      return "Fluency";
    case "accuracy":
      return "Accuracy";
    default:
      return category.trim() || "General";
  }
}

function upsertWeakness(
  weaknessMap: Map<string, WeaknessAccumulator>,
  item: {
    category: string;
    description: string;
    suggestion: string;
  },
) {
  const key = item.category.toLowerCase();
  const existing = weaknessMap.get(key);

  if (existing) {
    existing.frequency += 1;
    if (!existing.description && item.description) {
      existing.description = item.description;
    }
    if (!existing.suggestion && item.suggestion) {
      existing.suggestion = item.suggestion;
    }
    return;
  }

  weaknessMap.set(key, {
    category: item.category,
    description: item.description,
    frequency: 1,
    suggestion: item.suggestion,
  });
}

function getWeaknessHref(category: string): string {
  const normalized = category.toLowerCase();

  if (
    normalized.includes("grammar") ||
    normalized.includes("vocabulary") ||
    normalized.includes("coherence") ||
    normalized.includes("task")
  ) {
    return "/writing";
  }

  if (
    normalized.includes("fluency") ||
    normalized.includes("accuracy") ||
    normalized.includes("speaking") ||
    normalized.includes("expression")
  ) {
    return "/speaking";
  }

  return "/coach";
}

function truncate(
  value: string | null | undefined,
  length: number,
): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= length) {
    return trimmed;
  }

  return `${trimmed.slice(0, length - 1)}...`;
}

function formatStatusLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
