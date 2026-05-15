import Link from "next/link";
import { Compass, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <Card className="w-full max-w-xl border-slate-200 bg-white shadow-sm">
                <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                        <SearchX className="size-8" />
                    </div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                        404
                    </p>
                    <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-900">
                        Page not found
                    </h1>
                    <p className="mb-8 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                        The page you&apos;re looking for doesn&apos;t exist or may
                        have moved. Let&apos;s get you back to something useful.
                    </p>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button asChild className="bg-sky-600 hover:bg-sky-700">
                            <Link href="/">
                                <Home className="mr-2 size-4" />
                                Go to homepage
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                <Compass className="mr-2 size-4" />
                                Open dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
