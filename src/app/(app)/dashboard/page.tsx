import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/server/services/dashboard.service";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const dashboardData = await getDashboardData(currentUser.userId);

    return <DashboardView data={dashboardData} />;
}
