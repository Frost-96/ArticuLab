import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SpeakingPracticePage } from "@/components/speaking/speaking-practice-page";
import { getScenarioList } from "@/server/services/scenario.service";
import { getSpeakingHistory } from "@/server/services/speaking.service";
import type { SpeakingHistoryResult } from "@/types/speaking/speakingTypes";

function emptySpeakingHistory(pageSize: number): SpeakingHistoryResult {
  return {
    exercises: [],
    pagination: {
      page: 1,
      limit: pageSize,
      total: 0,
      totalPages: 1,
    },
  };
}

export default async function Page() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const pageSize = 20;
  const [scenarioListResult, historyResult] = await Promise.allSettled([
    getScenarioList({
      category: "speaking",
      page: 1,
      pageSize: 100,
    }),
    getSpeakingHistory(currentUser.userId, {
      page: 1,
      pageSize,
    }),
  ]);

  const scenarios =
    scenarioListResult.status === "fulfilled"
      ? scenarioListResult.value.prompts
      : [];
  const history =
    historyResult.status === "fulfilled"
      ? historyResult.value
      : emptySpeakingHistory(pageSize);
  const loadError =
    scenarioListResult.status === "rejected"
      ? "Speaking scenarios could not be loaded. Please refresh the page."
      : historyResult.status === "rejected"
        ? "Recent speaking history could not be loaded, but you can still start a new practice."
        : null;

  return (
    <SpeakingPracticePage
      scenarios={scenarios}
      history={history}
      loadError={loadError}
    />
  );
}
