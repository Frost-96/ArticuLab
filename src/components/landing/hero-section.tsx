import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
    "AI-powered essay scoring",
    "Real-time speaking practice",
    "Personalized feedback",
];

export function HeroSection() {
    return (
        <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-0 h-[36rem] w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100 via-fuchsia-50 to-transparent opacity-70 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-gradient-to-tl from-sky-100 to-transparent opacity-60 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-flex">
                        <Badge
                            variant="outline"
                            className="h-auto gap-2 border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700"
                        >
                            <Sparkles className="size-3.5" />
                            Now powered by AI feedback
                            <ArrowRight className="size-3.5" />
                        </Badge>
                    </div>

                    <h1 className="mb-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                        Master English with{" "}
                        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                            AI-Powered
                        </span>{" "}
                        Practice
                    </h1>

                    <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                        Practice writing essays and speaking scenarios with an AI
                        coach that gives instant, detailed feedback like a real
                        tutor, available whenever you need it.
                    </p>

                    <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            size="lg"
                            asChild
                            className="h-12 w-full bg-indigo-600 px-8 text-base hover:bg-indigo-700 sm:w-auto"
                        >
                            <Link href="/signup">
                                Start Learning for Free
                                <ArrowRight className="ml-1 size-5" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="h-12 w-full px-8 text-base sm:w-auto"
                        >
                            <a href="#demo">See How It Works</a>
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {highlights.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-2 text-sm text-slate-600"
                            >
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative mt-16">
                    <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-sky-500/20 blur-2xl" />

                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex gap-1.5">
                                <div className="size-3 rounded-full bg-rose-400" />
                                <div className="size-3 rounded-full bg-amber-400" />
                                <div className="size-3 rounded-full bg-emerald-400" />
                            </div>
                            <div className="flex flex-1 justify-center">
                                <div className="w-full max-w-xs rounded-md border border-slate-200 bg-white px-4 py-1 text-center text-xs text-slate-400">
                                    app.articulab.ai/coach
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-[26rem]">
                            <div className="hidden w-56 flex-col border-r border-slate-100 bg-slate-50 p-3 sm:flex">
                                <div className="mb-4 flex items-center gap-2 px-2">
                                    <div className="flex size-6 items-center justify-center rounded-md bg-indigo-600">
                                        <Sparkles className="size-3 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">
                                        ArticuLab
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {["AI Coach", "Grammar Help", "IELTS Prep"].map(
                                        (item, index) => (
                                            <div
                                                key={item}
                                                className={
                                                    index === 0
                                                        ? "rounded-md bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700"
                                                        : "rounded-md px-3 py-2 text-xs text-slate-500"
                                                }
                                            >
                                                {item}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col">
                                <div className="flex-1 space-y-4 p-6">
                                    <div className="flex max-w-md gap-3">
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                            <Sparkles className="size-3.5 text-indigo-600" />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                                            <p className="text-sm leading-6 text-slate-700">
                                                I found a grammar issue. You wrote{" "}
                                                <span className="rounded bg-rose-100 px-1 text-rose-700">
                                                    &quot;He go&quot;
                                                </span>{" "}
                                                and it should be{" "}
                                                <span className="font-medium text-emerald-600">
                                                    &quot;He went&quot;
                                                </span>
                                                .
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-auto flex max-w-sm justify-end gap-3">
                                        <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-white">
                                            <p className="text-sm">
                                                Thanks! Can you check the rest of my
                                                essay?
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex max-w-md gap-3">
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                            <Sparkles className="size-3.5 text-indigo-600" />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                                            <p className="text-sm leading-6 text-slate-700">
                                                Of course. Your essay scores{" "}
                                                <span className="font-semibold text-indigo-600">
                                                    7.5/9
                                                </span>{" "}
                                                overall. Here&apos;s the breakdown.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 p-4">
                                    <div className="mx-auto flex max-w-lg items-center gap-2">
                                        <div className="flex h-10 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-4">
                                            <span className="text-sm text-slate-400">
                                                Ask me anything about English...
                                            </span>
                                        </div>
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-600">
                                            <ArrowRight className="size-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <div className="mb-2 flex items-center justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                                key={index}
                                className="size-5 fill-amber-400 text-amber-400"
                            />
                        ))}
                    </div>
                    <p className="text-sm text-slate-600">
                        Trusted by{" "}
                        <span className="font-semibold text-slate-900">
                            10,000+
                        </span>{" "}
                        English learners worldwide
                    </p>
                </div>
            </div>
        </section>
    );
}
