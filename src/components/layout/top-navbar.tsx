"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  PenLine,
  Mic,
  MessageSquare,
  LayoutDashboard,
  Menu,
  Flame,
} from "lucide-react";
import type { CurrentUserDisplaySummary } from "@/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/ui/loading-overlay";
import { useUIStore } from "@/stores/uiStore";
import { UserNav } from "./user-nav";

const navItems = [
  {
    titleKey: "writing",
    href: "/writing",
    icon: PenLine,
  },
  {
    titleKey: "speaking",
    href: "/speaking",
    icon: Mic,
  },
  {
    titleKey: "coach",
    href: "/coach",
    icon: MessageSquare,
  },
  {
    titleKey: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

type TopNavbarProps = {
  userSummary: CurrentUserDisplaySummary | null;
};

export function TopNavbar({ userSummary }: TopNavbarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { toggleSidebar } = useUIStore();
  const streakLabel = userSummary
    ? t("streak", { count: userSummary.streak })
    : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <LoadingLink href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-base font-semibold text-slate-950 sm:block">
              ArticuLab
            </span>
          </LoadingLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <LoadingLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </LoadingLink>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          {streakLabel ? (
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {streakLabel}
              </span>
            </div>
          ) : null}

          {/* User Menu */}
          <UserNav userSummary={userSummary} />
        </div>
      </div>
    </header>
  );
}
