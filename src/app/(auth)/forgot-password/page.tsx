"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit() {
        if (!email.trim()) {
            return;
        }

        setSubmitted(true);
    }

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-indigo-600">
                    <Sparkles className="size-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Enter your account email and we&apos;ll help you get back in.
                </p>
            </div>

            <Card className="border-slate-200 shadow-lg">
                <CardHeader className="px-6 pb-0 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        We&apos;ll email a reset link if an account exists for this
                        address.
                    </p>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                    {submitted ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                    <Mail className="size-4 text-emerald-700" />
                                </div>
                                <div>
                                    <p className="font-medium text-emerald-900">
                                        Check your inbox
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                                        If <span className="font-medium">{email}</span>{" "}
                                        is registered, a reset email will arrive shortly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleSubmit}
                                disabled={!email.trim()}
                            >
                                Send reset link
                            </Button>
                        </>
                    )}

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
                        >
                            <ArrowLeft className="size-4" />
                            Back to login
                        </Link>
                        <p className="text-xs leading-5 text-slate-400">
                            This page is ready for the UX flow. If you want, we can
                            connect it to a real email reset backend next.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
