"use server";

import { cookies } from "next/headers";
import {
  type AppLocale,
  localeCookieMaxAgeSeconds,
  localeCookieName,
} from "@/i18n/locales";

export async function setLocaleCookie(locale: AppLocale) {
  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: localeCookieMaxAgeSeconds,
    path: "/",
  });
}
