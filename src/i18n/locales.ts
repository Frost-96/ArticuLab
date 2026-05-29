export const locales = ["en", "zh"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localeCookieName = "NEXT_LOCALE";
export const localeCookieMaxAgeSeconds = 365 * 24 * 60 * 60;

const localeSet = new Set<string>(locales);

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && localeSet.has(value);
}

export function parseAppLocale(value: unknown): AppLocale | null {
  return isAppLocale(value) ? value : null;
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): AppLocale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const preferredLanguages = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((language): language is string => Boolean(language));

  for (const language of preferredLanguages) {
    if (language === "zh" || language.startsWith("zh-")) {
      return "zh";
    }

    if (language === "en" || language.startsWith("en-")) {
      return "en";
    }
  }

  return defaultLocale;
}

export function getLocaleLabel(locale: AppLocale): string {
  return locale === "zh" ? "中文" : "English";
}
