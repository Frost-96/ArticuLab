// Route: app/dashboard/page.tsx
"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Flame,
  Mic,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
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
export default function Page() {
  const skillData = [
    { skill: "Grammar", score: 82 },
    { skill: "Vocabulary", score: 75 },
    { skill: "Coherence", score: 88 },
    { skill: "Task Achievement", score: 70 },
    { skill: "Fluency", score: 65 },
    { skill: "Pronunciation", score: 78 },
  ];

  const trendData = [
    { week: "W1", writing: 65, speaking: 60 },
    { week: "W2", writing: 68, speaking: 62 },
    { week: "W3", writing: 72, speaking: 68 },
    { week: "W4", writing: 70, speaking: 72 },
    { week: "W5", writing: 75, speaking: 74 },
    { week: "W6", writing: 78, speaking: 78 },
    { week: "W7", writing: 80, speaking: 82 },
    { week: "W8", writing: 82, speaking: 85 },
  ];

  const weakAreas = [
    { area: "Complex Sentence Structures", score: 45, improvement: "+12%" },
    { area: "Academic Vocabulary", score: 58, improvement: "+8%" },
    { area: "Coherence in Long Essays", score: 62, improvement: "+15%" },
    { area: "Speaking Confidence", score: 55, improvement: "+20%" },
  ];

  const recentActivities = [
    {
      type: "writing",
      title: "IELTS Task 2 - Technology",
      score: 7.5,
      time: "2 hours ago",
    },
    {
      type: "speaking",
      title: "Job Interview Simulation",
      score: 82,
      time: "5 hours ago",
    },
    {
      type: "coach",
      title: "Grammar Practice Session",
      score: null,
      time: "1 day ago",
    },
    {
      type: "writing",
      title: "Daily Writing #47",
      score: 7.0,
      time: "1 day ago",
    },
  ];
  const router = useRouter();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome back, John! 👋
            </h1>
            <p className="text-slate-500">
              Here's your learning progress this week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              This Week
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Start Learning
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold text-slate-900">47</p>
                  <p className="text-sm text-emerald-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +3 this week
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Study Time</p>
                  <p className="text-3xl font-bold text-slate-900">
                    12.5<span className="text-lg">h</span>
                  </p>
                  <p className="text-sm text-emerald-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2h from last week
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-slate-900">
                    7 <span className="text-2xl">🔥</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Best: 14 days</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Level</p>
                  <p className="text-3xl font-bold text-slate-900">B2+</p>
                  <p className="text-sm text-indigo-600 mt-1">
                    Upper Intermediate
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
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
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
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

          {/* Progress Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="week"
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                      domain={[50, 100]}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="writing"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1" }}
                      name="Writing"
                    />
                    <Line
                      type="monotone"
                      dataKey="speaking"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ fill: "#a855f7" }}
                      name="Speaking"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Areas to Improve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-600" />
                Areas to Improve
              </CardTitle>
              <CardDescription>
                Based on AI analysis of your sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium text-sm">Article usage (a/the)</p>
                    <p className="text-xs text-slate-500">
                      Appeared in 60% of your essays
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Practice
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium text-sm">Conditional sentences</p>
                    <p className="text-xs text-slate-500">Accuracy: 65%</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Practice
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Speaking pace control</p>
                    <p className="text-xs text-slate-500">
                      Sometimes too fast when nervous
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Practice
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    Today
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Pencil className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            IELTS Task 2 Essay
                          </p>
                          <p className="text-xs text-slate-500">
                            Technology in education
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          7.5
                        </p>
                        <p className="text-xs text-slate-400">2h ago</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Mic className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Job Interview Practice
                          </p>
                          <p className="text-xs text-slate-500">
                            Marketing manager role
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          8.0
                        </p>
                        <p className="text-xs text-slate-400">4h ago</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    Yesterday
                  </p>
                  <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI Coach Session</p>
                        <p className="text-xs text-slate-500">Grammar Q&A</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">25 min</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
