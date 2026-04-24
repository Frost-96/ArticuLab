"use client";

import { useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    MessageSquare,
    Mic,
    PenLine,
    Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "writing", label: "Writing Review", icon: PenLine },
    { id: "speaking", label: "Speaking Practice", icon: Mic },
    { id: "coach", label: "AI Coach", icon: MessageSquare },
];

export function DemoSection() {
    const [activeTab, setActiveTab] = useState("writing");

    return (
        <section id="demo" className="bg-slate-50 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        See It In Action
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Real AI feedback, in real time
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        A quick look at what practice sessions inside ArticuLab can
                        feel like.
                    </p>
                </div>

                <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mx-auto max-w-4xl">
                    {activeTab === "writing" ? <WritingDemo /> : null}
                    {activeTab === "speaking" ? <SpeakingDemo /> : null}
                    {activeTab === "coach" ? <CoachDemo /> : null}
                </div>
            </div>
        </section>
    );
}

function WritingDemo() {
    return (
        <div className="animate-scale-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                    <h3 className="font-semibold text-slate-900">Essay Review</h3>
                    <p className="text-xs text-slate-500">IELTS Task 2 • Technology</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-semibold text-indigo-600">7.5</p>
                    <p className="text-xs text-slate-400">Overall Band</p>
                </div>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-4">
                {[
                    { label: "Grammar", score: "7.0", color: "text-amber-600" },
                    { label: "Vocabulary", score: "8.0", color: "text-emerald-600" },
                    { label: "Coherence", score: "7.5", color: "text-sky-600" },
                    { label: "Task", score: "7.0", color: "text-violet-600" },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="border-r border-slate-100 py-3 text-center last:border-r-0"
                    >
                        <p className={`font-semibold ${item.color}`}>{item.score}</p>
                        <p className="text-xs text-slate-400">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4 p-6">
                <p className="text-sm leading-7 text-slate-700">
                    Technology has become{" "}
                    <span className="group relative cursor-help border-b-2 border-amber-400 bg-amber-100 px-0.5">
                        an important
                        <span className="absolute bottom-full left-0 mb-2 hidden w-48 rounded-lg bg-slate-900 p-2 text-xs text-white group-hover:block">
                            Consider using a more precise phrase like
                            &quot;an integral&quot; for a stronger tone.
                        </span>
                    </span>{" "}
                    part of modern society. While some{" "}
                    <span className="border-b-2 border-rose-400 bg-rose-100 px-0.5">
                        argues
                    </span>{" "}
                    that it has made life easier, others believe it{" "}
                    <span className="border-b-2 border-sky-400 bg-sky-100 px-0.5">
                        introduced new complexities
                    </span>
                    .
                </p>

                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <AlertCircle className="size-3.5 text-rose-500" />
                        Errors (2)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Lightbulb className="size-3.5 text-amber-500" />
                        Suggestions (3)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Star className="size-3.5 text-sky-500" />
                        Tips (1)
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpeakingDemo() {
    return (
        <div className="animate-scale-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-0 bg-violet-100 text-violet-700">
                        Job Interview
                    </Badge>
                    <span className="text-sm text-slate-500">
                        Marketing Manager Role
                    </span>
                </div>
            </div>

            <div className="space-y-4 p-6">
                <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm">
                        🤖
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                        <p className="text-sm leading-6 text-slate-700">
                            Tell me about a time when you handled a challenging
                            client situation. What was the outcome?
                        </p>
                        <button
                            type="button"
                            className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700"
                        >
                            Play audio
                        </button>
                    </div>
                </div>

                <div className="flex flex-row-reverse gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm">
                        👤
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-50 px-4 py-3">
                        <p className="text-sm leading-6 text-slate-700">
                            Sure. In my previous role, I had a client who was
                            unhappy with our campaign results, so I scheduled a
                            meeting to...
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className="border-emerald-200 text-emerald-600"
                            >
                                <CheckCircle2 className="mr-1 size-3" />
                                Good fluency
                            </Badge>
                            <span className="text-xs text-slate-400">0:34s</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center py-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex size-16 items-center justify-center rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700">
                            <Mic className="size-7 text-white" />
                        </div>
                        <p className="text-sm text-slate-500">Click to respond</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CoachDemo() {
    return (
        <div className="animate-scale-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900">AI Coach</h3>
                <p className="text-xs text-slate-500">Grammar Help Session</p>
            </div>

            <div className="space-y-4 p-6">
                <div className="flex flex-row-reverse gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm">
                        👤
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white">
                        <p className="text-sm">
                            What&apos;s the difference between &quot;affect&quot; and
                            &quot;effect&quot;?
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">
                        ✨
                    </div>
                    <div className="max-w-[85%] space-y-3 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                        <p className="text-sm leading-6 text-slate-700">
                            Great question. Here&apos;s the key difference:
                        </p>
                        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                            <p className="text-sm text-sky-800">
                                <strong>Affect</strong> is usually a verb that means
                                to influence something.
                            </p>
                            <p className="mt-1 text-xs text-sky-600">
                                &quot;The weather affects my mood.&quot;
                            </p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-sm text-emerald-800">
                                <strong>Effect</strong> is usually a noun that means
                                the result of a change.
                            </p>
                            <p className="mt-1 text-xs text-emerald-600">
                                &quot;The effect of the new policy was positive.&quot;
                            </p>
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                            Tip: think of <strong>A</strong>ffect as{" "}
                            <strong>A</strong>ction and <strong>E</strong>ffect as the{" "}
                            <strong>E</strong>nd result.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
