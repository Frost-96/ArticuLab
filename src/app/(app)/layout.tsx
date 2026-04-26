import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserDisplaySummary } from "@/server/services/profile.service";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const userSummary = currentUser
    ? await getCurrentUserDisplaySummary(currentUser.userId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar userSummary={userSummary} />
      <MobileSidebar userSummary={userSummary} />
      <main className="pt-14">{children}</main>
    </div>
  );
}
