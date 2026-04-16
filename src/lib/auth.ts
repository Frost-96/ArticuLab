import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { EnglishLevel, MembershipTier } from "@/validators";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 天

export type JWTPayload = {
    userId: string;
    email: string;
    name: string | null;
    englishLevel: EnglishLevel | null;
    membershipTier: MembershipTier;
};

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
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_SECONDS,
        path: "/",
    });
}

export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}
