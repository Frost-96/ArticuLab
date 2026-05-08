import { redirect } from "next/navigation";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCoachSidebarItems } from "@/server/services/navigation.service";

export default async function CoachLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const items = await getCoachSidebarItems(currentUser.userId);

    return (
        <div className="flex h-[calc(100vh-3.5rem)]">
            <LeftSidebar type="coach" items={items} />
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
}
