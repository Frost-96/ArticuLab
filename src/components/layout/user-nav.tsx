"use client";

import {
    LoadingLink,
    useAppLoading,
    useLoadingRouter,
} from "@/components/ui/loading-overlay";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
    Crown,
    CreditCard,
    Languages,
    LogOut,
    Settings,
    User,
} from "lucide-react";
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
import { saveLocalePreference } from "@/server/actions/settings.action";
import toast, { Toaster } from "react-hot-toast";
import type { AppLocale } from "@/i18n/locales";
import { setLocaleCookieOnClient } from "@/i18n/client";

type UserNavProps = {
    userSummary: CurrentUserDisplaySummary | null;
};

export function UserNav({ userSummary }: UserNavProps) {
    const router = useLoadingRouter();
    const { hideLoading, showLoading } = useAppLoading();
    const locale = useLocale() as AppLocale;
    const t = useTranslations("userMenu");
    const nav = useTranslations("nav");
    const common = useTranslations("common");
    const [isSwitchingLocale, startLocaleTransition] = useTransition();
    const displayName = userSummary?.displayName ?? t("learner");
    const email = userSummary?.email ?? "";
    const membershipTier = userSummary?.membershipTier ?? "free";
    const initials = getInitials(displayName);
    const nextLocale: AppLocale = locale === "zh" ? "en" : "zh";

    async function handleLogout() {
        showLoading(t("logout"));
        await logOut();
        toast.success(t("loggedOut"));
        router.push("/login");
        router.refresh();
    }

    function handleSwitchLocale() {
        setLocaleCookieOnClient(nextLocale);

        startLocaleTransition(() => {
            showLoading(common("switching"));
            void (async () => {
                const result = await saveLocalePreference(nextLocale);

                if (!result.success) {
                    hideLoading();
                    toast.error(result.error);
                    return;
                }

                router.refresh();
            })();
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage
                            src={userSummary?.avatar ?? undefined}
                            alt={displayName}
                        />
                        <AvatarFallback className="bg-sky-100 text-sky-700 text-sm">
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
                            <Badge
                                variant="secondary"
                                className="mt-1 w-fit text-xs"
                            >
                                {t("freePlan")}
                            </Badge>
                        ) : (
                            <Badge className="mt-1 w-fit bg-amber-500 text-xs text-white">
                                <Crown className="mr-1 h-3 w-3" />
                                {common("pro")}
                            </Badge>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <LoadingLink href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {nav("profile")}
                    </LoadingLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <LoadingLink href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {nav("settings")}
                    </LoadingLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <LoadingLink href="/pricing" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        {nav("billing")}
                    </LoadingLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={isSwitchingLocale}
                    onClick={handleSwitchLocale}
                    aria-busy={isSwitchingLocale || undefined}
                >
                    <Languages className="mr-2 h-4 w-4" />
                    {isSwitchingLocale
                        ? t("switching")
                        : t("switchTo", {
                              locale:
                                  nextLocale === "zh"
                                      ? common("chinese")
                                      : common("english"),
                          })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {membershipTier === "free" ? (
                    <>
                        <DropdownMenuItem asChild>
                            <LoadingLink
                                href="/pricing"
                                className="cursor-pointer text-sky-600 focus:text-sky-600"
                            >
                                <Crown className="mr-2 h-4 w-4" />
                                {t("upgrade")}
                            </LoadingLink>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                ) : null}
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                </DropdownMenuItem>
                <Toaster />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
