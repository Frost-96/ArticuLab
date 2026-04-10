import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, Briefcase, Lightbulb, Mic, Play, Square } from "lucide-react";

export default function Page() {
    const isRecording = false; // Example recording state

    return (
        // Route: app/speaking/[id]/page.tsx

        <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex flex-col">
            {/* Scenario Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-purple-100 text-purple-700">
                            <Briefcase className="w-3 h-3 mr-1" />
                            Job Interview
                        </Badge>
                        <Badge variant="outline">IELTS Part 2</Badge>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        Marketing Manager Interview
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Speaking with:{" "}
                        <span className="text-slate-700 font-medium">
                            HR Manager at Tech Corp
                        </span>
                        <span className="mx-2">•</span>
                        Round 4 of 6
                    </p>
                </div>
            </header>

            {/* Dialogue Area */}
            <main className="flex-1 overflow-auto py-6">
                <div className="max-w-3xl mx-auto px-6 space-y-4">
                    {/* AI Message */}
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900">
                                    HR Manager
                                </span>
                                <span className="text-xs text-slate-400">
                                    2:34 PM
                                </span>
                            </div>
                            <Card className="inline-block max-w-[90%]">
                                <CardContent className="p-4">
                                    <p className="text-slate-700">
                                        That's a great background! Can you tell
                                        me about a time when you had to handle a
                                        challenging situation with a team member
                                        or client?
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                        >
                                            <Play className="w-3 h-3 mr-1" />
                                            Play Audio
                                        </Button>
                                        <span className="text-xs text-slate-400">
                                            0:12
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* User Message */}
                    <div className="flex gap-3 flex-row-reverse">
                        <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src="/user-avatar.jpg" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-slate-400">
                                    2:35 PM
                                </span>
                                <span className="font-medium text-slate-900">
                                    You
                                </span>
                            </div>
                            <Card className="inline-block max-w-[90%] bg-indigo-50 border-indigo-100">
                                <CardContent className="p-4">
                                    <p className="text-slate-700">
                                        Yes, certainly. In my previous role, I
                                        had a situation where a key client was
                                        unhappy with our campaign performance. I
                                        scheduled a meeting...
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                        >
                                            <Play className="w-3 h-3 mr-1" />
                                            Replay
                                        </Button>
                                        <span className="text-xs text-slate-400">
                                            0:34
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Good fluency
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Recording Controls */}
            <div className="bg-white border-t border-slate-200 p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Live Transcript */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 min-h-[60px]">
                        <p className="text-sm text-slate-500 text-center">
                            {isRecording ? (
                                <span className="text-slate-700">
                                    Well, in my experience...
                                </span>
                            ) : (
                                "Your speech will appear here as you speak..."
                            )}
                        </p>
                    </div>

                    {/* Microphone Button */}
                    <div className="flex flex-col items-center">
                        <Button
                            size="lg"
                            className={cn(
                                "w-20 h-20 rounded-full transition-all",
                                isRecording
                                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                    : "bg-indigo-600 hover:bg-indigo-700",
                            )}
                        >
                            {isRecording ? (
                                <Square className="w-8 h-8" />
                            ) : (
                                <Mic className="w-8 h-8" />
                            )}
                        </Button>
                        <p className="text-sm text-slate-500 mt-3">
                            {isRecording
                                ? "Recording... Click to stop"
                                : "Click to start speaking"}
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Tip:</span> Use the
                            STAR method (Situation, Task, Action, Result) when
                            answering behavioral questions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
