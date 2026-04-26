"use client";

import React from "react";
import Link from "next/link";
import { User, Settings, CreditCard, LogOut, Crown } from "lucide-react";
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
import { useUIStore } from "@/stores/uiStore";
import { logOut } from "@/server/actions/auth.action";
import { redirect } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export function UserNav() {
    const { user } = useUIStore();
    const displayName = user.name?.trim() || user.email;

    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    async function handleLogout() {
        await logOut();
        toast.error("Logged out");
        redirect("/login");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={user.avatar} alt={displayName} />
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
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {user.plan === "free" && (
                            <Badge
                                variant="secondary"
                                className="w-fit mt-1 text-xs"
                            >
                                Free Plan
                            </Badge>
                        )}
                        {user.plan === "pro" && (
                            <Badge className="w-fit mt-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500">
                                <Crown className="h-3 w-3 mr-1" />
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
                {user.plan === "free" && (
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
                )}
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
