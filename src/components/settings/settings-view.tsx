"use client";

import {
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  LoadingLink,
  useAppLoading,
  useLoadingRouter,
} from "@/components/ui/loading-overlay";
import { useLocale, useTranslations } from "next-intl";
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
import type {
  AppLocale,
  EnglishLevel,
  LearningGoal,
  SettingsData,
} from "@/schema";
import { getInitials } from "@/lib/user-display";
import {
  saveLocalePreference,
  saveSettingsProfile,
} from "@/server/actions/settings.action";
import { deleteCurrentUserAction } from "@/server/actions/user.action";
import { logOut } from "@/server/actions/auth.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { setLocaleCookieOnClient } from "@/i18n/client";
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
  labelKey: EnglishLevel;
}> = [
  { value: "beginner", labelKey: "beginner" },
  { value: "elementary", labelKey: "elementary" },
  { value: "intermediate", labelKey: "intermediate" },
  { value: "upper-intermediate", labelKey: "upper-intermediate" },
  { value: "advanced", labelKey: "advanced" },
  { value: "not-sure", labelKey: "not-sure" },
];

const learningGoalOptions: Array<{
  value: LearningGoal;
  labelKey: LearningGoal;
}> = [
  { value: "exam-prep", labelKey: "exam-prep" },
  { value: "academic", labelKey: "academic" },
  { value: "career", labelKey: "career" },
  { value: "daily", labelKey: "daily" },
  { value: "immigration", labelKey: "immigration" },
];

const navItems = [
  { href: "#account", labelKey: "account", icon: User },
  { href: "#subscription", labelKey: "subscription", icon: CreditCard },
  { href: "#personalization", labelKey: "personalization", icon: Moon },
  { href: "#security", labelKey: "security", icon: Shield },
];

const selectClassName =
  "flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-900 shadow-none outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-3 focus-visible:ring-slate-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export function SettingsView({ data }: SettingsViewProps) {
  const router = useLoadingRouter();
  const { hideLoading, showLoading } = useAppLoading();
  const activeLocale = useLocale() as AppLocale;
  const t = useTranslations("settings");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const levels = useTranslations("levels");
  const goals = useTranslations("goals");
  const [isSaving, startSavingTransition] = useTransition();
  const [isSavingLocale, startLocaleTransition] = useTransition();
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
      showLoading(common("saving"));
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
      hideLoading();
      toast.error(result.error);
      return;
    }

    toast.success(t("profileUpdated"));
    router.refresh();
  }

  function handleLocaleChange(locale: AppLocale) {
    if (locale === activeLocale) {
      return;
    }

    setLocaleCookieOnClient(locale);

    startLocaleTransition(() => {
      showLoading(common("switching"));
      void submitLocaleUpdate(locale);
    });
  }

  async function submitLocaleUpdate(locale: AppLocale) {
    const result = await saveLocalePreference(locale);

    if (!result.success) {
      hideLoading();
      toast.error(result.error || t("languageSaveFailed"));
      return;
    }

    toast.success(t("languageSaved"));
    router.refresh();
  }

  function handleLogout() {
    startLogoutTransition(() => {
      showLoading(t("loggingOut"));
      void performLogout();
    });
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(t("deleteConfirm"));
    if (!confirmed) {
      return;
    }

    startDeleteAccountTransition(() => {
      showLoading(t("deleting"));
      void performDeleteAccount();
    });
  }

  async function performLogout() {
    await logOut();
    toast.success(t("loggingOut"));
    router.push("/login");
    router.refresh();
  }

  async function performDeleteAccount() {
    const result = await deleteCurrentUserAction();
    if (!result.success) {
      hideLoading();
      toast.error(result.error);
      return;
    }

    toast.success(t("accountDeleted"));
    router.push("/signup");
    router.refresh();
  }

  return (
    <div className="app-shell-page bg-[#f7f7f7]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
          </div>
          <Button variant="outline" asChild>
            <LoadingLink href="/profile">{t("viewProfile")}</LoadingLink>
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
                  {t(`sections.${item.labelKey}`)}
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
                title={t("sections.account")}
                description={t("accountDescription")}
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
                          ? common("pro")
                          : common("free")}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {data.account.email}
                    </p>
                  </div>
                </div>

                <SettingsRow
                  title={t("displayName")}
                  description={t("displayNameDescription")}
                  control={
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      placeholder={t("yourName")}
                      disabled={isSaving}
                      className="h-9"
                    />
                  }
                />

                <SettingsRow
                  title={t("email")}
                  description={t("emailDescription")}
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
                  title={t("avatar")}
                  description={t("avatarDescription")}
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
                  title={t("password")}
                  description={t("passwordDescription")}
                  control={
                    <Button type="button" variant="outline" disabled>
                      {t("changePassword")}
                    </Button>
                  }
                />
              </div>
            </section>

            <section id="subscription" className="scroll-mt-24">
              <SettingsSectionHeader
                title={t("sections.subscription")}
                description={getMembershipDescription(data, t)}
              />
              <div className="px-5">
                <InfoRow
                  title={t("plan")}
                  value={
                    data.membership.membershipTier === "pro"
                      ? common("pro")
                      : common("free")
                  }
                />
                <InfoRow
                  title={t("billingStatus")}
                  value={
                    data.membership.hasActiveSubscription
                      ? t("active")
                      : t("noActiveBilling")
                  }
                />
                <InfoRow
                  title={t("subscriptionPlan")}
                  value={formatSubscriptionPlan(
                    data.membership.subscriptionPlan,
                    t,
                  )}
                />
                <InfoRow
                  title={t("billingPeriod")}
                  value={
                    data.membership.subscriptionPeriodLabel ??
                    t("noActiveSubscription")
                  }
                />
                <SettingsRow
                  title={nav("billing")}
                  description={t("billingDescription")}
                  control={
                    <Button variant="outline" asChild>
                      <LoadingLink href="/pricing">
                        {data.membership.membershipTier === "pro"
                          ? t("manageBilling")
                          : t("upgrade")}
                      </LoadingLink>
                    </Button>
                  }
                />
              </div>
            </section>

            <section id="personalization" className="scroll-mt-24">
              <SettingsSectionHeader
                title={t("sections.personalization")}
                description={t("personalizationDescription")}
              />
              <div className="px-5">
                <SettingsRow
                  title={t("englishLevel")}
                  description={t("englishLevelDescription")}
                  control={
                    <div>
                      <Label htmlFor="englishLevel" className="sr-only">
                        {t("englishLevel")}
                      </Label>
                      <select
                        id="englishLevel"
                        className={selectClassName}
                        value={form.englishLevel}
                        onChange={(event) =>
                          updateField(
                            "englishLevel",
                            event.target.value as EnglishLevel | "",
                          )
                        }
                        disabled={isSaving}
                      >
                        <option value="">{common("notSet")}</option>
                        {englishLevelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {levels(option.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                />

                <SettingsRow
                  title={t("learningGoal")}
                  description={t("learningGoalDescription")}
                  control={
                    <div>
                      <Label htmlFor="learningGoal" className="sr-only">
                        {t("learningGoal")}
                      </Label>
                      <select
                        id="learningGoal"
                        className={selectClassName}
                        value={form.learningGoal}
                        onChange={(event) =>
                          updateField(
                            "learningGoal",
                            event.target.value as LearningGoal | "",
                          )
                        }
                        disabled={isSaving}
                      >
                        <option value="">{common("notSet")}</option>
                        {learningGoalOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {goals(option.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                />

                {readonlyRows.map((item) => (
                  <SettingsRow
                    key={item.key}
                    title={t(item.module.title)}
                    description={t(item.module.description)}
                    leading={<item.icon className="size-4 text-slate-400" />}
                    control={
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {t(item.module.statusLabel)}
                        </span>
                        <Switch
                          checked={false}
                          disabled
                          aria-label={t(item.module.title)}
                        />
                      </div>
                    }
                  >
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {t(item.module.detail)}
                    </p>
                  </SettingsRow>
                ))}
                <SettingsRow
                  title={t("language")}
                  description={t("languageDescription")}
                  leading={<Globe className="size-4 text-slate-400" />}
                  control={
                    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                      {(["en", "zh"] as const).map((locale) => (
                        <button
                          key={locale}
                          type="button"
                          disabled={isSavingLocale}
                          onClick={() => handleLocaleChange(locale)}
                          aria-busy={isSavingLocale || undefined}
                          className={cn(
                            "inline-flex min-w-16 items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-70",
                            activeLocale === locale
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-900",
                          )}
                        >
                          {isSavingLocale && activeLocale !== locale
                            ? common("switching")
                            : locale === "zh"
                              ? common("chinese")
                              : common("english")}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {t("languageDetail")}
                  </p>
                </SettingsRow>
              </div>
            </section>

            <section id="security" className="scroll-mt-24">
              <SettingsSectionHeader
                title={t("sections.security")}
                description={t("securityDescription")}
              />
              <div className="px-5">
                <SettingsRow
                  title={nav("logout")}
                  description={t("logoutDescription")}
                  control={
                    <LoadingButton
                      type="button"
                      variant="outline"
                      onClick={handleLogout}
                      disabled={!data.dangerZone.canLogout || isLoggingOut}
                      isLoading={isLoggingOut}
                      loadingText={t("loggingOut")}
                    >
                      <LogOut className="size-4" />
                      {nav("logout")}
                    </LoadingButton>
                  }
                />
                <SettingsRow
                  title={t("deleteAccount")}
                  description={t("deleteAccountDescription")}
                  control={
                    <LoadingButton
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={
                        !data.dangerZone.canDeleteAccount || isDeletingAccount
                      }
                      onClick={handleDeleteAccount}
                      isLoading={isDeletingAccount}
                      loadingText={t("deleting")}
                    >
                      <Trash2 className="size-4" />
                      {t("deleteAccount")}
                    </LoadingButton>
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
                {common("reset")}
              </Button>
              <LoadingButton
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={common("saving")}
              >
                {common("saveChanges")}
              </LoadingButton>
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
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
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

function formatSubscriptionPlan(
  plan: SettingsData["membership"]["subscriptionPlan"],
  t: ReturnType<typeof useTranslations<"settings">>,
) {
  switch (plan) {
    case "monthly":
      return t("monthly");
    case "yearly":
      return t("yearly");
    default:
      return t("noActivePlan");
  }
}

function getMembershipDescription(
  data: SettingsData,
  t: ReturnType<typeof useTranslations<"settings">>,
) {
  if (data.membership.hasActiveSubscription) {
    return t("subscriptionActiveDescription", {
      plan: formatSubscriptionPlan(data.membership.subscriptionPlan, t),
    });
  }

  if (data.membership.membershipTier === "pro") {
    return t("proNoBillingDescription");
  }

  return t("upgradeDescription");
}
