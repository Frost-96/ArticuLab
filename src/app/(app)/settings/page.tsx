import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { getCurrentUser } from "@/lib/auth";
import { getSettingsData } from "@/server/services/settings.service";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const settingsData = await getSettingsData(currentUser.userId);

    return <SettingsView data={settingsData} />;
}
