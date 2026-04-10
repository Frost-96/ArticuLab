import { LeftSidebar } from "@/components/layout/left-sidebar";

export default function SpeakingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <LeftSidebar type="speaking" />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
