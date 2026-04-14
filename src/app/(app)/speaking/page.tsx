"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  GraduationCap,
  Coffee,
  Users,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";

const scenarios = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions",
    icon: Briefcase,
    difficulty: "Intermediate",
    duration: "10-15 min",
    color: "bg-purple-100 text-purple-600",
    aiRole: "Hiring Manager",
  },
  {
    id: "ielts-part2",
    title: "IELTS Speaking Part 2",
    description: "Practice cue card topics with timing",
    icon: GraduationCap,
    difficulty: "All levels",
    duration: "5-10 min",
    color: "bg-blue-100 text-blue-600",
    aiRole: "IELTS Examiner",
  },
  {
    id: "casual-conversation",
    title: "Casual Conversation",
    description: "Practice everyday English conversation",
    icon: Coffee,
    difficulty: "Beginner",
    duration: "10-20 min",
    color: "bg-amber-100 text-amber-600",
    aiRole: "Native Speaker",
  },
  {
    id: "group-discussion",
    title: "Group Discussion",
    description: "Practice expressing opinions on topics",
    icon: Users,
    difficulty: "Advanced",
    duration: "15-20 min",
    color: "bg-emerald-100 text-emerald-600",
    aiRole: "Discussion Moderator",
  },
];

export default function SpeakingPage() {
  const router = useRouter();
  const { setCurrentSpeakingSession } = useAppStore();

  const handleStart = (scenario: (typeof scenarios)[0]) => {
    setCurrentSpeakingSession({
      id: Date.now().toString(),
      title: scenario.title,
      scenario: scenario.description,
      aiRole: scenario.aiRole,
      duration: 0,
      turns: 0,
      status: "active",
    });
    router.push(`/speaking/${scenario.id}`);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-3xl mx-auto pt-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Speaking Practice
          </h1>
          <p className="text-slate-500">
            Choose a scenario to start practicing your speaking skills
          </p>
        </div>

        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleStart(scenario)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${scenario.color} flex items-center justify-center shrink-0`}
                >
                  <scenario.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {scenario.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {scenario.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {scenario.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    Duration: {scenario.duration}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart(scenario);
                  }}
                >
                  Start
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
