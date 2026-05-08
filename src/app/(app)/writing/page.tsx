import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WritingPracticePage } from "@/components/writing/writing-practice-page";
import { getScenarioList } from "@/server/services/scenario.service";
import { getWritingHistory } from "@/server/services/writing.service";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const [scenarioList, history] = await Promise.all([
        getScenarioList({
            category: "writing",
            page: 1,
            pageSize: 100,
        }),
        getWritingHistory(currentUser.userId, {
            page: 1,
            pageSize: 20,
        }),
    ]);

    return <WritingPracticePage scenarios={scenarioList.prompts} history={history} />;
}
