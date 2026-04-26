import { SignJWT, jwtVerify } from "jose";
import type { EnglishLevel, MembershipTier } from "@/schema";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_COOKIE_NAME = "auth_token";

export type JWTPayload = {
    userId: string;
    email: string;
    name: string | null;
    englishLevel: EnglishLevel | null;
    hasCompletedOnboarding: boolean;
    membershipTier: MembershipTier;
};

type OnboardingFields = {
    englishLevel: EnglishLevel | null | undefined;
    learningGoal: string | null | undefined;
};

export function hasCompletedOnboarding(fields: OnboardingFields): boolean {
    return Boolean(fields.englishLevel && fields.learningGoal?.trim());
}

function normalizeJWTPayload(payload: Record<string, unknown>): JWTPayload {
    return {
        userId: String(payload.userId ?? ""),
        email: String(payload.email ?? ""),
        name: typeof payload.name === "string" ? payload.name : null,
        englishLevel:
            typeof payload.englishLevel === "string"
                ? (payload.englishLevel as EnglishLevel)
                : null,
        hasCompletedOnboarding: payload.hasCompletedOnboarding === true,
        membershipTier: payload.membershipTier as MembershipTier,
    };
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return normalizeJWTPayload(payload as Record<string, unknown>);
    } catch {
        return null;
    }
}

export function getDefaultAuthenticatedRedirectPath(
    payload: Pick<JWTPayload, "englishLevel" | "hasCompletedOnboarding">,
): string {
    if (!payload.hasCompletedOnboarding) {
        return "/onboarding";
    }

    return "/dashboard";
}

export function sanitizeRedirectTarget(
    redirectTo: string | null | undefined,
): string | null {
    if (!redirectTo) {
        return null;
    }

    const trimmed = redirectTo.trim();

    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return null;
    }

    if (trimmed.includes("\\")) {
        return null;
    }

    try {
        const url = new URL(trimmed, "http://localhost");
        if (url.origin !== "http://localhost") {
            return null;
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return null;
    }
}

export function resolveAuthenticatedRedirect(
    payload: Pick<JWTPayload, "englishLevel" | "hasCompletedOnboarding">,
    redirectTo?: string | null,
): string {
    if (!payload.hasCompletedOnboarding) {
        return "/onboarding";
    }

    return (
        sanitizeRedirectTarget(redirectTo) ??
        getDefaultAuthenticatedRedirectPath(payload)
    );
}

export function getAuthCookieMaxAgeSeconds(): number {
    return COOKIE_MAX_AGE_SECONDS;
}
