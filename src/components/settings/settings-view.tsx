"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CreditCard,
    Crown,
    Globe,
    LogOut,
    Moon,
    Shield,
    Trash2,
    User,
} from "lucide-react";
import type { EnglishLevel, LearningGoal, SettingsData } from "@/schema";
import { getInitials } from "@/lib/user-display";
import { saveSettingsProfile } from "@/server/actions/settings.action";
import { deleteCurrentUserAction } from "@/server/actions/user.action";
import { logOut } from "@/server/actions/auth.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast";

type SettingsViewProps = {
    data: SettingsData;
};

type SettingsFormState = {
    name: string;
    avatar: string;
    englishLevel: EnglishLevel | "";
    learningGoal: LearningGoal | "";
};

const englishLevelOptions: Array<{
    value: EnglishLevel;
    label: string;
}> = [
    { value: "beginner", label: "Beginner" },
    { value: "elementary", label: "Elementary" },
    { value: "intermediate", label: "Intermediate" },
    { value: "upper-intermediate", label: "Upper Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "not-sure", label: "Not Sure Yet" },
];

const learningGoalOptions: Array<{
    value: LearningGoal;
    label: string;
}> = [
    { value: "exam-prep", label: "Exam Preparation" },
    { value: "academic", label: "Academic English" },
    { value: "career", label: "Career & Professional" },
    { value: "daily", label: "Daily Communication" },
    { value: "immigration", label: "Immigration" },
];

const selectClassName =
    "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

export function SettingsView({ data }: SettingsViewProps) {
    const router = useRouter();
    const [isSaving, startSavingTransition] = useTransition();
    const [isLoggingOut, startLogoutTransition] = useTransition();
    const [isDeletingAccount, startDeleteAccountTransition] = useTransition();
    const [form, setForm] = useState<SettingsFormState>({
        name: data.account.name ?? "",
        avatar: data.account.avatar ?? "",
        englishLevel: data.account.englishLevel ?? "",
        learningGoal: data.account.learningGoal ?? "",
    });

    const initials = getInitials(data.account.displayName);
    const readonlyCards = [
        {
            key: "notifications",
            icon: Bell,
            module: data.readonlyModules.notifications,
        },
        {
            key: "appearance",
            icon: Moon,
            module: data.readonlyModules.appearance,
        },
        {
            key: "language",
            icon: Globe,
            module: data.readonlyModules.language,
        },
    ];

    function updateField<K extends keyof typeof form>(
        key: K,
        value: (typeof form)[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        startSavingTransition(() => {
            void submitProfileUpdate();
        });
    }

    async function submitProfileUpdate() {
        const result = await saveSettingsProfile({
            name: form.name,
            avatar: form.avatar,
            englishLevel: form.englishLevel || null,
            learningGoal: form.learningGoal || null,
        });

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(result.data.message);
        router.refresh();
    }

    function handleLogout() {
        startLogoutTransition(() => {
            void performLogout();
        });
    }

    function handleDeleteAccount() {
        const confirmed = window.confirm(
            "Delete your account? This will hide your profile and sign you out.",
        );
        if (!confirmed) {
            return;
        }

        startDeleteAccountTransition(() => {
            void performDeleteAccount();
        });
    }

    async function performLogout() {
        await logOut();
        toast.success("Logged out");
        router.push("/login");
        router.refresh();
    }

    async function performDeleteAccount() {
        const result = await deleteCurrentUserAction();
        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("Account deleted");
        router.push("/signup");
        router.refresh();
    }

    return (
        <div className="app-shell-page">
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
                <div className="soft-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                            Settings
                        </h1>
                        <p className="mt-1 text-slate-500">
                            Manage your real account profile and membership details.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge
                            variant={
                                data.membership.membershipTier === "pro"
                                    ? "default"
                                    : "secondary"
                            }
                            className={
                                data.membership.membershipTier === "pro"
                                    ? "bg-sky-600 text-white"
                                    : ""
                            }
                        >
                            {data.membership.membershipTier === "pro"
                                ? "Pro Member"
                                : "Free Member"}
                        </Badge>
                        <Button variant="outline" asChild>
                            <Link href="/profile">View Profile</Link>
                        </Button>
                    </div>
                </div>

                <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={data.account.avatar ?? undefined}
                                        alt={data.account.displayName}
                                    />
                                    <AvatarFallback className="bg-sky-100 text-2xl font-semibold text-sky-700">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        {data.account.displayName}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {data.account.email}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {data.account.englishLevelLabel ?? "Level not set"}
                                        </Badge>
                                        <Badge variant="outline">
                                            {data.account.learningGoalLabel ?? "Goal not set"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:ml-auto">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    Your navigation, dashboard, and profile now read from
                                    the same account source.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-slate-500" />
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(event) =>
                                            updateField("name", event.target.value)
                                        }
                                        placeholder="Your name"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        value={data.account.email}
                                        disabled
                                        readOnly
                                    />
                                    <p className="text-xs text-slate-500">
                                        Email changes are not available yet.
                                    </p>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="avatar">Avatar URL</Label>
                                    <Input
                                        id="avatar"
                                        value={form.avatar}
                                        onChange={(event) =>
                                            updateField("avatar", event.target.value)
                                        }
                                        placeholder="https://example.com/avatar.jpg"
                                        disabled={isSaving}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Leave blank to use initials as your avatar.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="englishLevel">
                                        English Level
                                    </Label>
                                    <select
                                        id="englishLevel"
                                        className={selectClassName}
                                        value={form.englishLevel}
                                        onChange={(event) =>
                                            updateField(
                                                "englishLevel",
                                                event.target.value as
                                                    | EnglishLevel
                                                    | "",
                                            )
                                        }
                                        disabled={isSaving}
                                    >
                                        <option value="">Not set</option>
                                        {englishLevelOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="learningGoal">
                                        Learning Goal
                                    </Label>
                                    <select
                                        id="learningGoal"
                                        className={selectClassName}
                                        value={form.learningGoal}
                                        onChange={(event) =>
                                            updateField(
                                                "learningGoal",
                                                event.target.value as
                                                    | LearningGoal
                                                    | "",
                                            )
                                        }
                                        disabled={isSaving}
                                    >
                                        <option value="">Not set</option>
                                        {learningGoalOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        Password
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Password updates are not available yet.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" disabled>
                                    Change Password
                                </Button>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSaving}
                                    onClick={() =>
                                        setForm({
                                            name: data.account.name ?? "",
                                            avatar: data.account.avatar ?? "",
                                            englishLevel:
                                                data.account.englishLevel ?? "",
                                            learningGoal:
                                                data.account.learningGoal ?? "",
                                        })
                                    }
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-sky-600 hover:bg-sky-700"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            Membership & Billing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-white">
                                    <Crown className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {data.membership.membershipTier === "pro"
                                            ? "Pro Membership"
                                            : "Free Membership"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {getMembershipDescription(data)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={
                                        data.membership.hasActiveSubscription
                                            ? "default"
                                            : "secondary"
                                    }
                                    className={
                                        data.membership.hasActiveSubscription
                                            ? "bg-amber-500 text-white"
                                            : ""
                                    }
                                >
                                    {data.membership.hasActiveSubscription
                                        ? "Active"
                                        : "No active billing"}
                                </Badge>
                                <Button variant="outline" asChild>
                                    <Link href="/pricing">
                                        {data.membership.membershipTier === "pro"
                                            ? "Manage Billing"
                                            : "Upgrade"}
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <InfoTile
                                label="Membership Tier"
                                value={
                                    data.membership.membershipTier === "pro"
                                        ? "Pro"
                                        : "Free"
                                }
                            />
                            <InfoTile
                                label="Subscription Plan"
                                value={formatSubscriptionPlan(
                                    data.membership.subscriptionPlan,
                                )}
                            />
                            <InfoTile
                                label="Billing Period"
                                value={
                                    data.membership.subscriptionPeriodLabel ??
                                    "No active subscription"
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                    {readonlyCards.map((item) => (
                        <Card key={item.key} className="bg-white shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <item.icon className="h-4 w-4 text-slate-500" />
                                        {item.module.title}
                                    </CardTitle>
                                    <Badge variant="outline">
                                        {item.module.statusLabel}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="text-slate-700">
                                    {item.module.description}
                                </p>
                                <p className="text-slate-500">
                                    {item.module.detail}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-red-100 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-red-600">
                            <Shield className="h-4 w-4" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    Log Out
                                </p>
                                <p className="text-xs text-slate-500">
                                    Log out of your account on this device.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleLogout}
                                disabled={!data.dangerZone.canLogout || isLoggingOut}
                            >
                                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                                {isLoggingOut ? "Logging out..." : "Log Out"}
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    Delete Account
                                </p>
                                <p className="text-xs text-slate-500">
                                    Soft delete your account and log out of this device.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={
                                    !data.dangerZone.canDeleteAccount ||
                                    isDeletingAccount
                                }
                                onClick={handleDeleteAccount}
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                {isDeletingAccount
                                    ? "Deleting..."
                                    : "Delete Account"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Toaster />
        </div>
    );
}

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function formatSubscriptionPlan(plan: SettingsData["membership"]["subscriptionPlan"]) {
    switch (plan) {
        case "monthly":
            return "Monthly";
        case "yearly":
            return "Yearly";
        default:
            return "No active plan";
    }
}

function getMembershipDescription(data: SettingsData) {
    if (data.membership.hasActiveSubscription) {
        return `Your ${formatSubscriptionPlan(data.membership.subscriptionPlan).toLowerCase()} subscription is active.`;
    }

    if (data.membership.membershipTier === "pro") {
        return "Pro access is enabled, but no active billing record is linked right now.";
    }

    return "Upgrade to unlock unlimited sessions, AI feedback, and richer practice flows.";
}
