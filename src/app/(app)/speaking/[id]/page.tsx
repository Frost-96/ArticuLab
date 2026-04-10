"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/appStore";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Square,
  Send,
  Volume2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

export default function SpeakingSessionPage() {
  const router = useRouter();
  const { currentSpeakingSession } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hello! Thank you for coming in today. Could you please start by telling me a little about yourself and your experience?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg: Message = {
      role: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        role: "ai",
        content:
          "That's a great response! Could you elaborate more on that point and provide a specific example?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  const handleFinish = () => {
    router.push(`/speaking/session-1/review`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/speaking")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="font-medium text-slate-900">
              {currentSpeakingSession?.title || "Speaking Practice"}
            </h1>
            <p className="text-xs text-slate-400">
              {currentSpeakingSession?.aiRole || "AI Coach"} • Live session
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleFinish}
          >
            <Square className="h-3 w-3 mr-2 fill-current" />
            Finish
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                  msg.role === "ai"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {msg.role === "ai" ? <Sparkles className="h-4 w-4" /> : "You"}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-xl px-4 py-3",
                  msg.role === "ai"
                    ? "bg-white border border-slate-200 text-slate-700"
                    : "bg-indigo-600 text-white",
                )}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.role === "ai" && (
                  <button className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                    <Volume2 className="h-3 w-3" />
                    Play
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-slate-200 bg-white p-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your response or use the mic..."
              className="w-full min-h-[48px] max-h-32 px-4 py-3 resize-none rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              rows={1}
            />
          </div>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className="shrink-0 h-12 w-12"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="icon"
            className="shrink-0 h-12 w-12 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">
          Press Enter to send • Shift+Enter for new line • Click mic to record
        </p>
      </div>
    </div>
  );
}
