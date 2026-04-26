import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/server/services/profile.service";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const profileData = await getProfileData(currentUser.userId);

    return <ProfileView data={profileData} />;
}
