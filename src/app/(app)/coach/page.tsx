"use client";

import React from "react";
import { Sparkles, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachPage() {
    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="font-medium text-slate-900">AI Coach</h1>
                    <p className="text-xs text-slate-400">
                        Always here to help
                    </p>
                </div>
            </div>

            {/* Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    How can I help you today?
                </h2>
                <p className="text-slate-500 text-center max-w-md mb-8">
                    I'm your AI English coach. Ask me about grammar, vocabulary,
                    writing tips, or practice speaking scenarios.
                </p>

                {/* Quick Suggestions */}
                <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                    <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start text-left"
                    >
                        <span className="text-indigo-600 mb-1">✍️</span>
                        <span className="font-medium text-sm">
                            Check my essay
                        </span>
                        <span className="text-xs text-slate-400">
                            Get grammar and style feedback
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start text-left"
                    >
                        <span className="text-indigo-600 mb-1">📚</span>
                        <span className="font-medium text-sm">
                            Vocabulary help
                        </span>
                        <span className="text-xs text-slate-400">
                            Learn new words and phrases
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start text-left"
                    >
                        <span className="text-indigo-600 mb-1">🎯</span>
                        <span className="font-medium text-sm">IELTS tips</span>
                        <span className="text-xs text-slate-400">
                            Exam strategies and practice
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start text-left"
                    >
                        <span className="text-indigo-600 mb-1">💬</span>
                        <span className="font-medium text-sm">
                            Practice speaking
                        </span>
                        <span className="text-xs text-slate-400">
                            Role-play conversations
                        </span>
                    </Button>
                </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-200 bg-white p-4 shrink-0">
                <div className="max-w-3xl mx-auto flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            placeholder="Ask me anything about English..."
                            className="w-full min-h-[48px] max-h-32 px-4 py-3 pr-12 resize-none rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            rows={1}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-12 w-12"
                    >
                        <Mic className="w-5 h-5" />
                    </Button>
                    <Button
                        size="icon"
                        className="shrink-0 h-12 w-12 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
