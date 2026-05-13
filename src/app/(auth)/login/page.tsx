"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/server/actions/auth.action";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const next = searchParams.get("next") ?? undefined;

    async function onClick() {
        const user = await login({
            email,
            password,
            redirectTo: next,
        });

        if (!user.success) {
            toast.error(user.error);
            return;
        }

        toast.success("Login successfully");
        router.replace(user.data.redirect);
    }

    const signUpHref = next
        ? `/signup?next=${encodeURIComponent(next)}`
        : "/signup";

    return (
        <div className="w-full max-w-md">
            <div className="mb-7 text-center">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-sky-600">
                    <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">ArticuLab</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Your AI-powered English practice partner
                </p>
            </div>

            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="px-6 pb-0 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Welcome back
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Sign in to continue learning
                    </p>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <Button variant="outline" className="w-full" type="button">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">
                                or
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm">
                                Password
                            </Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-sky-600 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        className="h-10 w-full bg-sky-600 hover:bg-sky-700"
                        onClick={onClick}
                    >
                        Sign In
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href={signUpHref}
                            className="font-medium text-sky-600 hover:underline"
                        >
                            Sign up free
                        </Link>
                    </p>
                </CardContent>
            </Card>
            <Toaster />
        </div>
    );
}
