import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    MessageSquare,
    Mic,
    PenLine,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
    "IELTS and TOEFL writing review",
    "Voice-first speaking scenarios",
    "Progress analytics that close the loop",
];

export function HeroSection() {
    return (
        <section className="border-b border-slate-200 bg-white px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                    <Badge
                        variant="outline"
                        className="mb-5 gap-2 rounded-md border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700"
                    >
                        <Sparkles className="size-3.5" />
                        AI English practice workspace
                    </Badge>

                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                        ArticuLab
                    </h1>
                    <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                        A focused writing, speaking, and AI coaching platform for
                        learners preparing for IELTS, TOEFL, and academic English.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button
                            size="lg"
                            asChild
                            className="h-11 bg-sky-600 px-5 hover:bg-sky-700"
                        >
                            <Link href="/signup">
                                Start practicing
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-11 px-5">
                            <a href="#demo">View product demo</a>
                        </Button>
                    </div>

                    <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        {highlights.map((item) => (
                            <div key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                    <div className="rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-md bg-sky-600 text-white">
                                    <Sparkles className="size-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        ArticuLab Workspace
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Practice {"->"} Feedback {"->"} Analysis {"->"} Improvement
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="hidden sm:inline-flex">
                                Live session
                            </Badge>
                        </div>

                        <div className="grid min-h-[26rem] lg:grid-cols-[180px_1fr]">
                            <aside className="hidden border-r border-slate-200 bg-slate-50 p-3 lg:block">
                                {[
                                    ["Writing", PenLine, true],
                                    ["Speaking", Mic, false],
                                    ["Coach", MessageSquare, false],
                                    ["Dashboard", BarChart3, false],
                                ].map(([label, Icon, active]) => {
                                    const TypedIcon = Icon as typeof PenLine;
                                    return (
                                        <div
                                            key={label as string}
                                            className={
                                                active
                                                    ? "mb-1 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950 ring-1 ring-slate-200"
                                                    : "mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-500"
                                            }
                                        >
                                            <TypedIcon className="size-4" />
                                            {label as string}
                                        </div>
                                    );
                                })}
                            </aside>

                            <div className="min-w-0 p-4 sm:p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-950">
                                            Writing Review
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            IELTS Task 2 · 284 words
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-semibold text-sky-700">
                                            7.5
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Overall score
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {[
                                        ["Grammar", "7.0"],
                                        ["Vocabulary", "8.0"],
                                        ["Coherence", "7.5"],
                                        ["Task", "7.0"],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <p className="text-lg font-semibold text-slate-950">
                                                {value}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
                                    <p className="text-sm leading-7 text-slate-700">
                                        Technology has become{" "}
                                        <span className="rounded border border-amber-200 bg-amber-50 px-1 text-amber-800">
                                            an important
                                        </span>{" "}
                                        part of modern society. While some people{" "}
                                        <span className="rounded border border-red-200 bg-red-50 px-1 text-red-800">
                                            argues
                                        </span>{" "}
                                        that it improves access to education, others
                                        believe it{" "}
                                        <span className="rounded border border-blue-200 bg-blue-50 px-1 text-blue-800">
                                            introduces new complexities
                                        </span>
                                        .
                                    </p>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                                            Suggestion
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-amber-950">
                                            Replace broad phrases with more precise
                                            academic wording.
                                        </p>
                                    </div>
                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                                            Next practice
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-blue-950">
                                            Write one paragraph focused on concession
                                            and contrast.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
