"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Clock,
  Download,
  MessageSquare,
  Target,
  TrendingUp,
  Volume2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const skillScores = [
  { skill: "Fluency", score: 78 },
  { skill: "Pronunciation", score: 82 },
  { skill: "Grammar", score: 75 },
  { skill: "Vocabulary", score: 80 },
  { skill: "Coherence", score: 85 },
  { skill: "Confidence", score: 70 },
];

const commonMistakes = [
  {
    type: "grammar",
    mistake: "I have went there yesterday",
    correction: "I went there yesterday",
    explanation:
      "Use simple past tense for completed actions with specific time references",
  },
  {
    type: "pronunciation",
    mistake: "comfortable (com-for-ta-ble)",
    correction: "comfortable (comf-ter-ble)",
    explanation: "Native speakers typically reduce this to 3 syllables",
  },
  {
    type: "vocabulary",
    mistake: "very good",
    correction: "excellent / outstanding / impressive",
    explanation: "Use more specific and varied vocabulary",
  },
];

const betterExpressions = [
  {
    original: "I think...",
    improved: "I believe... / In my opinion... / From my perspective...",
  },
  {
    original: "It's good",
    improved: "It's beneficial / advantageous / valuable",
  },
  {
    original: "I like it",
    improved: "I appreciate it / I find it appealing / It resonates with me",
  },
  { original: "Very important", improved: "Crucial / Essential / Paramount" },
];

const turnAnalysis = [
  { turn: 1, fluency: 85, grammar: 80, vocab: 75 },
  { turn: 2, fluency: 78, grammar: 82, vocab: 80 },
  { turn: 3, fluency: 82, grammar: 78, vocab: 85 },
  { turn: 4, fluency: 80, grammar: 85, vocab: 82 },
];

export default function Page() {
  const router = useRouter();
  const fluencyScore = 78;
  const accuracyScore = 82;
  const duration = 480; // 8 minutes
  const turns = 8;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 70) return "text-indigo-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-100";
    if (score >= 70) return "bg-indigo-100";
    if (score >= 60) return "bg-amber-100";
    return "bg-red-100";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/speaking")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Speaking Review
            </h1>
            <p className="text-slate-500 mt-1">Job Interview Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Volume2 className="h-4 w-4 mr-2" />
            Play Recording
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Fluency</p>
                <p
                  className={cn(
                    "text-3xl font-bold mt-1",
                    getScoreColor(fluencyScore),
                  )}
                >
                  {fluencyScore}%
                </p>
              </div>
              <div
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center",
                  getScoreBg(fluencyScore),
                )}
              >
                <TrendingUp
                  className={cn("h-6 w-6", getScoreColor(fluencyScore))}
                />
              </div>
            </div>
            <Progress value={fluencyScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Accuracy</p>
                <p
                  className={cn(
                    "text-3xl font-bold mt-1",
                    getScoreColor(accuracyScore),
                  )}
                >
                  {accuracyScore}%
                </p>
              </div>
              <div
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center",
                  getScoreBg(accuracyScore),
                )}
              >
                <Target
                  className={cn("h-6 w-6", getScoreColor(accuracyScore))}
                />
              </div>
            </div>
            <Progress value={accuracyScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Duration</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatTime(duration)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Target: 5-10 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Turns
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {turns}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Great engagement!</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillScores}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Turn Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Turn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="turn"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    label={{
                      value: "Turn",
                      position: "bottom",
                      fill: "#94a3b8",
                    }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    domain={[60, 100]}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="fluency"
                    fill="#6366f1"
                    name="Fluency"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="grammar"
                    fill="#a855f7"
                    name="Grammar"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="vocab"
                    fill="#22c55e"
                    name="Vocabulary"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Mistakes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Common Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commonMistakes.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-slate-200 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.type === "grammar"
                        ? "destructive"
                        : item.type === "pronunciation"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {item.type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-slate-500">Said:</span>{" "}
                    <span className="line-through text-red-500">
                      "{item.mistake}"
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">Better:</span>{" "}
                    <span className="text-emerald-600 font-medium">
                      "{item.correction}"
                    </span>
                  </p>
                </div>
                <p className="text-xs text-slate-500">{item.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Better Expressions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              Better Expressions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {betterExpressions.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    INSTEAD OF
                  </p>
                  <p className="text-sm text-slate-700">"{item.original}"</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-1">
                    TRY
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">
                    {item.improved}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dialogue Transcript */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Full Transcript</CardTitle>
            <Button variant="outline" size="sm">
              <Volume2 className="h-4 w-4 mr-2" />
              Play All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                role: "ai",
                text: "Hello! Thank you for coming in today. Could you please start by telling me a little about yourself and your experience in marketing?",
              },
              {
                role: "user",
                text: "Thank you for having me. I have over 5 years of experience in digital marketing, specializing in social media strategy and content creation. In my current role, I've led several successful campaigns that increased brand engagement by 40%.",
              },
              {
                role: "ai",
                text: "That's impressive experience! Can you tell me about a specific campaign you led that you're particularly proud of?",
              },
              {
                role: "user",
                text: "Certainly. Last year, I spearheaded our Q4 product launch campaign across Instagram and TikTok. We used a mix of influencer partnerships and user-generated content, which resulted in our highest engagement rates ever and a 25% increase in sales compared to the previous quarter.",
              },
            ].map((turn, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  turn.role === "user" ? "flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                    turn.role === "ai"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {turn.role === "ai" ? "AI" : "You"}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3",
                    turn.role === "ai"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-indigo-600 text-white",
                  )}
                >
                  <p className="text-sm">{turn.text}</p>
                  {turn.role === "user" && (
                    <button className="mt-2 flex items-center gap-1 text-xs text-indigo-200 hover:text-white">
                      <Volume2 className="h-3 w-3" />
                      Play
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push("/speaking")}>
          Practice Again
        </Button>
        <Button onClick={() => router.push("/speaking")}>New Scenario</Button>
      </div>
    </div>
  );
}
