"use client";

import {
  type AppLocale,
  localeCookieMaxAgeSeconds,
  localeCookieName,
} from "@/i18n/locales";

export function setLocaleCookieOnClient(locale: AppLocale) {
  document.cookie = [
    `${localeCookieName}=${locale}`,
    "Path=/",
    `Max-Age=${localeCookieMaxAgeSeconds}`,
    "SameSite=Lax",
  ].join("; ");
}
