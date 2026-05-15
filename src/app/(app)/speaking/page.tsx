import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SpeakingPracticePage } from "@/components/speaking/speaking-practice-page";
import { getScenarioList } from "@/server/services/scenario.service";
import { getSpeakingHistory } from "@/server/services/speaking.service";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const [scenarioList, history] = await Promise.all([
        getScenarioList({
            category: "speaking",
            page: 1,
            pageSize: 100,
        }),
        getSpeakingHistory(currentUser.userId, {
            page: 1,
            pageSize: 20,
        }),
    ]);

    return <SpeakingPracticePage scenarios={scenarioList.prompts} history={history} />;
}
