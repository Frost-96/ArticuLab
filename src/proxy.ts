import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  getDefaultAuthenticatedRedirectPath,
  verifyToken,
} from "@/lib/auth-core";
import {
  defaultLocale,
  localeCookieMaxAgeSeconds,
  localeCookieName,
  parseAppLocale,
  resolveLocaleFromAcceptLanguage,
} from "@/i18n/locales";

function resolveRequestLocale(request: NextRequest) {
  return (
    parseAppLocale(request.cookies.get(localeCookieName)?.value) ??
    resolveLocaleFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

function withLocaleCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const locale = resolveRequestLocale(request);

  response.headers.set("x-articulab-locale", locale);

  if (!request.cookies.has(localeCookieName)) {
    response.cookies.set({
      name: localeCookieName,
      value: locale,
      maxAge: localeCookieMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}

function buildLoginRedirect(
  request: NextRequest,
  includeNext: boolean,
): NextResponse {
  const loginUrl = new URL("/login", request.url);

  if (includeNext) {
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  }

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
  const hasInvalidToken = Boolean(token) && !user;
  const isOnboardingRoute = pathname === "/onboarding";
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  if (isAuthRoute || isOnboardingRoute) {
    if (user) {
      if (isOnboardingRoute && !user.hasCompletedOnboarding) {
        return withLocaleCookie(request, NextResponse.next());
      }

      return withLocaleCookie(
        request,
        NextResponse.redirect(
          new URL(getDefaultAuthenticatedRedirectPath(user), request.url),
        ),
      );
    }

    const response = withLocaleCookie(request, NextResponse.next());
    return hasInvalidToken ? clearAuthCookie(response) : response;
  }

  if (pathname === "/") {
    const response = withLocaleCookie(request, NextResponse.next());
    return hasInvalidToken ? clearAuthCookie(response) : response;
  }

  if (user) {
    if (!user.hasCompletedOnboarding) {
      return withLocaleCookie(
        request,
        NextResponse.redirect(new URL("/onboarding", request.url)),
      );
    }

    return withLocaleCookie(request, NextResponse.next());
  }

  const response = withLocaleCookie(request, buildLoginRedirect(request, true));
  return hasInvalidToken ? clearAuthCookie(response) : response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/onboarding",
    "/dashboard/:path*",
    "/coach/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/writing/:path*",
    "/speaking/:path*",
  ],
};
