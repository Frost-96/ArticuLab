import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  localeCookieName,
  parseAppLocale,
  resolveLocaleFromAcceptLanguage,
} from "@/i18n/locales";

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale =
    parseAppLocale(cookieStore.get(localeCookieName)?.value) ??
    parseAppLocale(headerStore.get("x-articulab-locale")) ??
    resolveLocaleFromAcceptLanguage(headerStore.get("accept-language")) ??
    defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
