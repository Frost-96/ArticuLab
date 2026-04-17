"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getExamConfig } from "@/lib/writing-data";
import { useAppStore } from "@/store/appStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const { currentWritingSession, updateWritingContent } = useAppStore();
  const router = useRouter();

  const [timeSpent, setTimeSpent] = useState(
    currentWritingSession?.timeSpent ?? 0,
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const content = currentWritingSession?.content ?? "";
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Resolve exam-specific targets
  const examCfg =
    currentWritingSession?.scenarioType &&
    currentWritingSession.scenarioType !== "daily"
      ? getExamConfig(currentWritingSession.scenarioType)
      : null;
  const wordTarget = examCfg?.wordTarget ?? 250;
  const timeLimitSec = examCfg ? parseInt(examCfg.timeLimit) * 60 : 1800;

  const handleSubmit = () => {
    setIsTimerRunning(false);
    router.push(`/writing/${currentWritingSession?.id ?? "new"}/review`);
  };

  if (!currentWritingSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-500">No active writing session.</p>
          <Button asChild>
            <Link href="/writing">Back to Writing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/writing">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>

          {examCfg ? (
            <Badge
              variant="outline"
              className={cn("text-xs", examCfg.badgeColor)}
            >
              {examCfg.label}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Daily Mode
            </Badge>
          )}

          <p className="text-sm font-medium text-slate-700 hidden sm:block">
            {currentWritingSession.title}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="font-mono text-sm font-medium">
            {formatTime(timeSpent)}
          </span>
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-1 hover:bg-slate-200 rounded"
          >
            {isTimerRunning ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Prompt Card */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Writing Prompt
                  </p>
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {currentWritingSession.prompt}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-indigo-100">
                <div className="flex items-center gap-1.5">
                  {wordCount >= wordTarget ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm text-slate-600">
                    {wordTarget}+ words
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {timeSpent <= timeLimitSec ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-slate-600">
                    {examCfg?.timeLimit ?? "30 min"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor Area */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Textarea
                value={content}
                onChange={(e) => updateWritingContent(e.target.value)}
                placeholder="Start writing your essay here..."
                className="min-h-[460px] border-0 focus-visible:ring-0 resize-none p-6 text-base leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Words:</span>
              <span
                className={cn(
                  "font-mono text-sm font-medium",
                  wordCount >= wordTarget
                    ? "text-emerald-600"
                    : "text-amber-600",
                )}
              >
                {wordCount}/{wordTarget}
              </span>
              <Progress
                value={Math.min((wordCount / wordTarget) * 100, 100)}
                className="w-24 h-2"
              />
            </div>
            <div className="text-sm text-slate-400">{charCount} chars</div>
          </div>

          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Submit for Review
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
