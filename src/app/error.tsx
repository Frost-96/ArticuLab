"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <Card className="w-full max-w-xl border-rose-200 bg-white shadow-sm">
                <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <AlertTriangle className="size-8" />
                    </div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
                        Something went wrong
                    </p>
                    <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">
                        We hit an unexpected error
                    </h1>
                    <p className="mb-2 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                        The page couldn&apos;t finish loading. This is often
                        temporary, so retrying is a good first step.
                    </p>
                    {error.digest ? (
                        <p className="mb-8 text-xs text-slate-400">
                            Reference: {error.digest}
                        </p>
                    ) : (
                        <div className="mb-8" />
                    )}

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button
                            onClick={() => unstable_retry()}
                            className="bg-sky-600 hover:bg-sky-700"
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Try again
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">
                                <Home className="mr-2 size-4" />
                                Back to homepage
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
