import { LeftSidebar } from "@/components/layout/left-sidebar";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <LeftSidebar type="coach" />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
