"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sparkles,
    PenLine,
    Mic,
    MessageSquare,
    LayoutDashboard,
    Bell,
    Menu,
    Flame,
} from "lucide-react";
import type { CurrentUserDisplaySummary } from "@/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { UserNav } from "./user-nav";

const navItems = [
    {
        title: "Writing",
        href: "/writing",
        icon: PenLine,
    },
    {
        title: "Speaking",
        href: "/speaking",
        icon: Mic,
    },
    {
        title: "Coach",
        href: "/coach",
        icon: MessageSquare,
    },
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
];

type TopNavbarProps = {
    userSummary: CurrentUserDisplaySummary | null;
};

export function TopNavbar({ userSummary }: TopNavbarProps) {
    const pathname = usePathname();
    const { toggleSidebar } = useUIStore();
    const streakLabel = userSummary
        ? `${userSummary.streak} day${userSummary.streak === 1 ? "" : "s"}`
        : null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="flex h-full items-center justify-between px-4">
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
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="hidden font-semibold text-lg text-slate-900 sm:block">
                            ArticuLab
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Streak Badge */}
                    {streakLabel ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                            <Flame className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-700">
                                {streakLabel}
                            </span>
                        </div>
                    ) : null}

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* User Menu */}
                    <UserNav userSummary={userSummary} />
                </div>
            </div>
        </header>
    );
}
