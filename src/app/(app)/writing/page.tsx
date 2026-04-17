"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DAILY_PROMPTS, EXAM_CONFIGS, pickRandom } from "@/lib/writing-data";
import { useAppStore } from "@/store/appStore";
import type { WritingScenarioType } from "@/schema";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BookOpen,
    Clock,
    FileText,
    PenLine,
    Shuffle,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { useState } from "react";

// ─── Status config ─────────────────────────────────────────────────────────────

const WRITING_STATUS_CONFIG = {
    draft: { label: "Draft", color: "text-slate-500" },
    submitted: { label: "Submitted", color: "text-indigo-600" },
    reviewed: { label: "Reviewed", color: "text-emerald-600" },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
    const { setCurrentWritingSession, writingSessions } = useAppStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"daily" | "exam">("daily");
    const [examScenarioType, setExamScenarioType] =
        useState<WritingScenarioType>("ielts_task2");
    const [customPrompt, setCustomPrompt] = useState("");

    const totalWords = writingSessions.reduce((sum, s) => sum + s.wordCount, 0);
    const reviewedCount = writingSessions.filter(
        (s) => s.status === "reviewed",
    ).length;

    const currentExam =
        EXAM_CONFIGS.find((e) => e.id === examScenarioType) ?? EXAM_CONFIGS[0]!;

    const startSession = (
        prompt: string,
        scenarioType: WritingScenarioType,
    ) => {
        const id = Date.now().toString();
        const isExam = scenarioType !== "daily";
        const examCfg = EXAM_CONFIGS.find((e) => e.id === scenarioType);
        const title = isExam
            ? (examCfg?.label ?? scenarioType)
            : `Daily Writing #${writingSessions.length + 1}`;
        setCurrentWritingSession({
            id,
            title,
            scenarioType,
            isCustomPrompt: false,
            prompt,
            content: "",
            wordCount: 0,
            timeSpent: 0,
            status: "draft",
            createdAt: new Date(),
        });
        router.push(`/writing/${id}`);
    };

    const handleRandom = () => {
        const pool = activeTab === "exam" ? currentExam.prompts : DAILY_PROMPTS;
        const prompt = customPrompt || pickRandom(pool) || "";
        if (!prompt) return;
        startSession(prompt, activeTab === "exam" ? examScenarioType : "daily");
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Writing Practice
                    </h1>
                    <p className="text-slate-500 mt-0.5">
                        Choose a prompt and start writing
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                            {totalWords.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">words written</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                            {writingSessions.length}
                        </p>
                        <p className="text-xs text-slate-500">sessions</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">
                            {reviewedCount}
                        </p>
                        <p className="text-xs text-slate-500">reviewed</p>
                    </div>
                </div>
            </div>

            {/* Mode Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "daily" | "exam")}
            >
                <TabsList className="w-full grid grid-cols-2 h-10">
                    <TabsTrigger value="daily" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Daily Practice
                    </TabsTrigger>
                    <TabsTrigger value="exam" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Exam Mode
                    </TabsTrigger>
                </TabsList>

                {/* ── Daily ──────────────────────────────────────────────── */}
                <TabsContent value="daily" className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Pick a prompt or get a random one to start your
                            session.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleRandom}
                        >
                            <Shuffle className="h-3.5 w-3.5" />
                            Random
                        </Button>
                    </div>
                    {DAILY_PROMPTS.slice(0, 3).map((prompt, i) => (
                        <PromptCard
                            key={i}
                            prompt={prompt}
                            label="Daily"
                            labelColor="bg-indigo-100 text-indigo-700"
                            onClick={() => startSession(prompt, "daily")}
                        />
                    ))}
                </TabsContent>

                {/* ── Exam ───────────────────────────────────────────────── */}
                <TabsContent value="exam" className="mt-4 space-y-5">
                    {/* Exam Type Selector */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">
                            Select exam type
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {EXAM_CONFIGS.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => setExamScenarioType(exam.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                        examScenarioType === exam.id
                                            ? cn(
                                                  exam.pillActive,
                                                  "border-transparent shadow-sm",
                                              )
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                    )}
                                >
                                    {exam.shortLabel}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exam Info Bar */}
                    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                                {currentExam.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {currentExam.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                {currentExam.wordRange}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {currentExam.timeLimit}
                            </span>
                        </div>
                    </div>

                    {/* Prompts for selected exam */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Sample questions
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={handleRandom}
                            >
                                <Shuffle className="h-3.5 w-3.5" />
                                Random
                            </Button>
                        </div>
                        {currentExam.prompts.map((prompt, i) => (
                            <PromptCard
                                key={i}
                                prompt={prompt}
                                label={currentExam.shortLabel}
                                labelColor={currentExam.badgeColor}
                                onClick={() =>
                                    startSession(prompt, examScenarioType)
                                }
                            />
                        ))}
                    </div>

                    {/* Custom prompt */}
                    <div className="pt-1 border-t border-slate-200 space-y-2">
                        <p className="text-sm font-medium text-slate-700">
                            Paste your own question
                        </p>
                        <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Paste an exam question here..."
                            rows={3}
                            className="resize-none"
                        />
                        <Button
                            onClick={handleRandom}
                            disabled={!customPrompt.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            Start Writing
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Recent Sessions */}
            {writingSessions.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            Recent Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 p-2">
                        {writingSessions.map((session) => {
                            const examCfg =
                                session.scenarioType !== "daily"
                                    ? EXAM_CONFIGS.find(
                                          (e) => e.id === session.scenarioType,
                                      )
                                    : null;
                            const statusCfg =
                                WRITING_STATUS_CONFIG[session.status];
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        setCurrentWritingSession(session);
                                        router.push(`/writing/${session.id}`);
                                    }}
                                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                            session.scenarioType !== "daily"
                                                ? "bg-amber-100"
                                                : "bg-indigo-100",
                                        )}
                                    >
                                        {session.scenarioType !== "daily" ? (
                                            <FileText className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <PenLine className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {session.title}
                                            </p>
                                            {examCfg && (
                                                <span
                                                    className={cn(
                                                        "text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0",
                                                        examCfg.badgeColor,
                                                    )}
                                                >
                                                    {examCfg.shortLabel}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {session.prompt}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {session.wordCount > 0 && (
                                            <span className="text-xs text-slate-400">
                                                {session.wordCount}w
                                            </span>
                                        )}
                                        {session.overallScore && (
                                            <span className="text-sm font-semibold text-emerald-600">
                                                {session.overallScore}
                                            </span>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs",
                                                statusCfg.color,
                                            )}
                                        >
                                            {statusCfg.label}
                                        </Badge>
                                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 mb-2">
                            Quick tips for better scores
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {[
                                "Plan your essay structure (5 min)",
                                "Vary sentence length and structure",
                                "Meet the minimum word count",
                                "Proofread before submitting",
                            ].map((tip) => (
                                <p
                                    key={tip}
                                    className="text-sm text-slate-600 flex items-center gap-1.5"
                                >
                                    <TrendingUp className="h-3 w-3 text-indigo-500 shrink-0" />
                                    {tip}
                                </p>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Prompt Card ──────────────────────────────────────────────────────────────

interface PromptCardProps {
    prompt: string;
    label: string;
    labelColor: string;
    onClick: () => void;
}

function PromptCard({ prompt, label, labelColor, onClick }: PromptCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
        >
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5",
                        labelColor,
                    )}
                >
                    {label}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed flex-1">
                    {prompt}
                </p>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-0.5" />
            </div>
        </button>
    );
}
