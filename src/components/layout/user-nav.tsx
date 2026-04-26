"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, CreditCard, LogOut, Settings, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/user-display";
import type { CurrentUserDisplaySummary } from "@/schema";
import { logOut } from "@/server/actions/auth.action";
import toast, { Toaster } from "react-hot-toast";

type UserNavProps = {
    userSummary: CurrentUserDisplaySummary | null;
};

export function UserNav({ userSummary }: UserNavProps) {
    const router = useRouter();
    const displayName = userSummary?.displayName ?? "Learner";
    const email = userSummary?.email ?? "";
    const membershipTier = userSummary?.membershipTier ?? "free";
    const initials = getInitials(displayName);

    async function handleLogout() {
        await logOut();
        toast.success("Logged out");
        router.push("/login");
        router.refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage
                            src={userSummary?.avatar ?? undefined}
                            alt={displayName}
                        />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{displayName}</p>
                        <p className="text-xs text-slate-500">{email}</p>
                        {membershipTier === "free" ? (
                            <Badge variant="secondary" className="mt-1 w-fit text-xs">
                                Free Plan
                            </Badge>
                        ) : (
                            <Badge className="mt-1 w-fit bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                                <Crown className="mr-1 h-3 w-3" />
                                Pro
                            </Badge>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {membershipTier === "free" ? (
                    <>
                        <DropdownMenuItem asChild>
                            <Link
                                href="/pricing"
                                className="cursor-pointer text-indigo-600 focus:text-indigo-600"
                            >
                                <Crown className="mr-2 h-4 w-4" />
                                Upgrade to Pro
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                ) : null}
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
                <Toaster />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
