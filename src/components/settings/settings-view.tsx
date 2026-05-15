"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CreditCard,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const navItems = [
    { href: "#account", label: "Account", icon: User },
    { href: "#subscription", label: "Subscription", icon: CreditCard },
    { href: "#personalization", label: "Personalization", icon: Moon },
    { href: "#security", label: "Security", icon: Shield },
];

const selectClassName =
    "flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-900 shadow-none outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-3 focus-visible:ring-slate-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

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
    const readonlyRows = [
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

    function resetForm() {
        setForm({
            name: data.account.name ?? "",
            avatar: data.account.avatar ?? "",
            englishLevel: data.account.englishLevel ?? "",
            learningGoal: data.account.learningGoal ?? "",
        });
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
        <div className="app-shell-page bg-[#f7f7f7]">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                            Settings
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your account, subscription, and learning preferences.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/profile">View profile</Link>
                    </Button>
                </div>

                <div className="grid min-w-0 gap-5 lg:grid-cols-[184px_minmax(0,1fr)]">
                    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
                        <nav className="flex w-full max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm lg:flex-col">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                                >
                                    <item.icon className="size-4 text-slate-500" />
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    <form
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        onSubmit={handleSubmit}
                    >
                        <section id="account" className="scroll-mt-24">
                            <SettingsSectionHeader
                                title="Account"
                                description="Basic information shown across ArticuLab."
                            />
                            <div className="px-5">
                                <div className="flex flex-col gap-4 border-b border-slate-100 py-4 sm:flex-row sm:items-center">
                                    <Avatar className="size-16">
                                        <AvatarImage
                                            src={data.account.avatar ?? undefined}
                                            alt={data.account.displayName}
                                        />
                                        <AvatarFallback className="bg-slate-100 text-lg font-medium text-slate-700">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-base font-medium text-slate-950">
                                                {data.account.displayName}
                                            </p>
                                            <Badge variant="secondary">
                                                {data.membership.membershipTier === "pro"
                                                    ? "Pro"
                                                    : "Free"}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 truncate text-sm text-slate-500">
                                            {data.account.email}
                                        </p>
                                    </div>
                                </div>

                                <SettingsRow
                                    title="Display name"
                                    description="This name appears in your navigation, profile, and dashboard."
                                    control={
                                        <Input
                                            id="name"
                                            value={form.name}
                                            onChange={(event) =>
                                                updateField("name", event.target.value)
                                            }
                                            placeholder="Your name"
                                            disabled={isSaving}
                                            className="h-9"
                                        />
                                    }
                                />

                                <SettingsRow
                                    title="Email address"
                                    description="Email changes are not available yet."
                                    control={
                                        <Input
                                            id="email"
                                            value={data.account.email}
                                            disabled
                                            readOnly
                                            className="h-9 bg-slate-50 text-slate-500"
                                        />
                                    }
                                />

                                <SettingsRow
                                    title="Avatar URL"
                                    description="Leave blank to use your initials."
                                    control={
                                        <Input
                                            id="avatar"
                                            value={form.avatar}
                                            onChange={(event) =>
                                                updateField("avatar", event.target.value)
                                            }
                                            placeholder="https://example.com/avatar.jpg"
                                            disabled={isSaving}
                                            className="h-9"
                                        />
                                    }
                                />

                                <SettingsRow
                                    title="Password"
                                    description="Password updates are not available yet."
                                    control={
                                        <Button type="button" variant="outline" disabled>
                                            Change password
                                        </Button>
                                    }
                                />
                            </div>
                        </section>

                        <section id="subscription" className="scroll-mt-24">
                            <SettingsSectionHeader
                                title="Subscription"
                                description={getMembershipDescription(data)}
                            />
                            <div className="px-5">
                                <InfoRow
                                    title="Plan"
                                    value={
                                        data.membership.membershipTier === "pro"
                                            ? "Pro"
                                            : "Free"
                                    }
                                />
                                <InfoRow
                                    title="Billing status"
                                    value={
                                        data.membership.hasActiveSubscription
                                            ? "Active"
                                            : "No active billing"
                                    }
                                />
                                <InfoRow
                                    title="Subscription plan"
                                    value={formatSubscriptionPlan(
                                        data.membership.subscriptionPlan,
                                    )}
                                />
                                <InfoRow
                                    title="Billing period"
                                    value={
                                        data.membership.subscriptionPeriodLabel ??
                                        "No active subscription"
                                    }
                                />
                                <SettingsRow
                                    title="Billing"
                                    description="Manage plan details and upgrades from pricing."
                                    control={
                                        <Button variant="outline" asChild>
                                            <Link href="/pricing">
                                                {data.membership.membershipTier === "pro"
                                                    ? "Manage billing"
                                                    : "Upgrade"}
                                            </Link>
                                        </Button>
                                    }
                                />
                            </div>
                        </section>

                        <section id="personalization" className="scroll-mt-24">
                            <SettingsSectionHeader
                                title="Personalization"
                                description="Tune the learning context attached to your account."
                            />
                            <div className="px-5">
                                <SettingsRow
                                    title="English level"
                                    description="Used to tailor prompts and practice difficulty."
                                    control={
                                        <div>
                                            <Label htmlFor="englishLevel" className="sr-only">
                                                English level
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
                                    }
                                />

                                <SettingsRow
                                    title="Learning goal"
                                    description="Helps the app focus feedback around your goal."
                                    control={
                                        <div>
                                            <Label htmlFor="learningGoal" className="sr-only">
                                                Learning goal
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
                                    }
                                />

                                {readonlyRows.map((item) => (
                                    <SettingsRow
                                        key={item.key}
                                        title={item.module.title}
                                        description={item.module.description}
                                        leading={<item.icon className="size-4 text-slate-400" />}
                                        control={
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">
                                                    {item.module.statusLabel}
                                                </span>
                                                <Switch
                                                    checked={false}
                                                    disabled
                                                    aria-label={item.module.title}
                                                />
                                            </div>
                                        }
                                    >
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            {item.module.detail}
                                        </p>
                                    </SettingsRow>
                                ))}
                            </div>
                        </section>

                        <section id="security" className="scroll-mt-24">
                            <SettingsSectionHeader
                                title="Security"
                                description="Session controls and account removal."
                            />
                            <div className="px-5">
                                <SettingsRow
                                    title="Log out"
                                    description="Log out of your account on this device."
                                    control={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleLogout}
                                            disabled={
                                                !data.dangerZone.canLogout ||
                                                isLoggingOut
                                            }
                                        >
                                            <LogOut className="size-4" />
                                            {isLoggingOut ? "Logging out..." : "Log out"}
                                        </Button>
                                    }
                                />
                                <SettingsRow
                                    title="Delete account"
                                    description="Soft delete your account and log out of this device."
                                    control={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            disabled={
                                                !data.dangerZone.canDeleteAccount ||
                                                isDeletingAccount
                                            }
                                            onClick={handleDeleteAccount}
                                        >
                                            <Trash2 className="size-4" />
                                            {isDeletingAccount
                                                ? "Deleting..."
                                                : "Delete account"}
                                        </Button>
                                    }
                                />
                            </div>
                        </section>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSaving}
                                onClick={resetForm}
                            >
                                Reset
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

function SettingsSectionHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="border-b border-slate-100 bg-white px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
    );
}

function SettingsRow({
    title,
    description,
    control,
    leading,
    children,
}: {
    title: string;
    description: string;
    control: ReactNode;
    leading?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="grid gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-start">
            <div className="flex min-w-0 gap-3">
                {leading ? (
                    <div className="mt-0.5 shrink-0 text-slate-400">{leading}</div>
                ) : null}
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-950">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                        {description}
                    </p>
                    {children}
                </div>
            </div>
            <div className="min-w-0 sm:justify-self-end sm:text-right">{control}</div>
        </div>
    );
}

function InfoRow({ title, value }: { title: string; value: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-sm font-medium text-slate-950">{value}</p>
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
