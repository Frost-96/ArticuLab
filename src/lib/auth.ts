import { cookies } from "next/headers";
import {
    AUTH_COOKIE_NAME,
    getAuthCookieMaxAgeSeconds,
    type JWTPayload,
    verifyToken,
} from "./auth-core";

export {
    AUTH_COOKIE_NAME,
    getDefaultAuthenticatedRedirectPath,
    hasCompletedOnboarding,
    resolveAuthenticatedRedirect,
    sanitizeRedirectTarget,
    signToken,
    verifyToken,
    type JWTPayload,
} from "./auth-core";

export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: getAuthCookieMaxAgeSeconds(),
        path: "/",
    });
}

export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}
