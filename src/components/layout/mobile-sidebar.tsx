"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight,
    CreditCard,
    Flame,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Mic,
    PenLine,
    Settings,
    Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getInitials } from "@/lib/user-display";
import type { CurrentUserDisplaySummary } from "@/schema";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { logOut } from "@/server/actions/auth.action";
import toast, { Toaster } from "react-hot-toast";

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

type MobileSidebarProps = {
    userSummary: CurrentUserDisplaySummary | null;
};

export function MobileSidebar({ userSummary }: MobileSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const displayName = userSummary?.displayName ?? "Learner";
    const email = userSummary?.email ?? "";
    const membershipTier = userSummary?.membershipTier ?? "free";
    const streak = userSummary?.streak ?? 0;
    const userInitials = getInitials(displayName);

    async function handleLogout() {
        await logOut();
        setSidebarOpen(false);
        toast.success("Logged out");
        router.push("/login");
        router.refresh();
    }

    return (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="border-b border-slate-200 p-4">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold">ArticuLab</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex h-[calc(100%-65px)] flex-col">
                    <div className="border-b border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={userSummary?.avatar ?? undefined} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {email}
                                </p>
                            </div>
                            <Badge
                                variant={membershipTier === "pro" ? "default" : "secondary"}
                                className="shrink-0"
                            >
                                {membershipTier === "pro" ? "Pro" : "Free"}
                            </Badge>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <div className="flex items-center gap-2">
                                <Flame className="h-5 w-5 text-amber-500" />
                                <div>
                                    <p className="text-sm font-medium text-amber-700">
                                        {streak} Day Streak
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        Keep it going!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-auto p-2">
                        <div className="space-y-1">
                            {mainNavItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-700 hover:bg-slate-100",
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.title}
                                        <ChevronRight
                                            className={cn(
                                                "ml-auto h-4 w-4 transition-transform",
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
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

                    {membershipTier === "free" ? (
                        <div className="border-t border-slate-200 p-4">
                            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                                <p className="text-sm font-medium">Upgrade to Pro</p>
                                <p className="mt-1 text-xs text-indigo-100">
                                    Unlimited essays, speaking practice & more
                                </p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-3 w-full bg-white text-indigo-700 hover:bg-indigo-50"
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
                    ) : null}

                    <div className="border-t border-slate-200 p-2">
                        <button
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-5 w-5" />
                            Log out
                        </button>
                    </div>
                    <Toaster />
                </div>
            </SheetContent>
        </Sheet>
    );
}
