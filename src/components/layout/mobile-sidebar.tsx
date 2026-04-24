"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    PenLine,
    Mic,
    MessageSquare,
    LayoutDashboard,
    CreditCard,
    Settings,
    LogOut,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/uiStore";

const mainNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Writing Practice", href: "/writing", icon: PenLine },
    { title: "Speaking Practice", href: "/speaking", icon: Mic },
    { title: "AI Coach", href: "/coach", icon: MessageSquare },
];

const secondaryNavItems = [
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Billing", href: "/pricing", icon: CreditCard },
];

export function MobileSidebar() {
    const pathname = usePathname();
    const { sidebarOpen, setSidebarOpen, user } = useUIStore();
    const displayName = user.name?.trim() || user.email;
    const userInitials =
        displayName
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U";

    return (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b border-slate-200">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-lg">ArticuLab</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100%-65px)]">
                    {/* User Info */}
                    <div className="p-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {displayName}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user.email}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    user.plan === "pro"
                                        ? "default"
                                        : "secondary"
                                }
                                className="shrink-0"
                            >
                                {user.plan === "pro" ? "Pro" : "Free"}
                            </Badge>
                        </div>

                        {/* Streak */}
                        <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔥</span>
                                <div>
                                    <p className="text-sm font-medium text-amber-700">
                                        {user.streak} Day Streak
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        Keep it going!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Navigation */}
                    <nav className="flex-1 p-2 overflow-auto">
                        <div className="space-y-1">
                            {mainNavItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-700 hover:bg-slate-100",
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.title}
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 ml-auto transition-transform",
                                                isActive && "text-indigo-700",
                                            )}
                                        />
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="my-4 border-t border-slate-200" />

                        <div className="space-y-1">
                            {secondaryNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-700 hover:bg-slate-100",
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Upgrade Banner (for free users) */}
                    {user.plan === "free" && (
                        <div className="p-4 border-t border-slate-200">
                            <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <p className="font-medium text-sm">
                                    Upgrade to Pro
                                </p>
                                <p className="text-xs text-indigo-100 mt-1">
                                    Unlimited essays, speaking practice & more
                                </p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full mt-3 bg-white text-indigo-700 hover:bg-indigo-50"
                                    asChild
                                >
                                    <Link
                                        href="/pricing"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        View Plans
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Logout */}
                    <div className="p-2 border-t border-slate-200">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut className="h-5 w-5" />
                            Log out
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
