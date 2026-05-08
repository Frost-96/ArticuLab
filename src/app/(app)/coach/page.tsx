import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CoachHistoryPage } from "@/components/coach/coach-history-page";
import { getCoachPageData } from "@/server/services/coach.service";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ id?: string | string[] }>;
}) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const { id } = await searchParams;
    const activeConversationId = Array.isArray(id) ? id[0] : id;
    const data = await getCoachPageData(currentUser.userId, activeConversationId);

    return <CoachHistoryPage data={data} />;
}
