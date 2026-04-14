import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar />
      <MobileSidebar />
      <main className="pt-14">{children}</main>
    </div>
  );
}
