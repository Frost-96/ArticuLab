import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    Clock,
    Link,
    MessageCircle,
    Play,
    Sparkles,
    Target,
    TrendingUp,
    X,
} from "lucide-react";

export default function Page() {
    return (
        // Route: app/speaking/[id]/review/page.tsx

        <div className="min-h-[calc(100vh-56px)] bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2"
                        >
                            <Link href="/speaking">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Speaking
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Speaking Review
                        </h1>
                        <p className="text-sm text-slate-500">
                            Job Interview Practice • Completed today
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline">
                            <Play className="w-4 h-4 mr-2" />
                            Replay Session
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Practice Again
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">
                                    Fluency
                                </span>
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                7.5
                            </p>
                            <p className="text-xs text-emerald-600">
                                +0.5 from last
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">
                                    Accuracy
                                </span>
                                <Target className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                8.0
                            </p>
                            <p className="text-xs text-slate-400">
                                Same as last
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">
                                    Duration
                                </span>
                                <Clock className="w-4 h-4 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                4:32
                            </p>
                            <p className="text-xs text-slate-400">
                                272 seconds
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">
                                    Speaking Turns
                                </span>
                                <MessageCircle className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                6
                            </p>
                            <p className="text-xs text-slate-400">
                                ~45 sec each
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Skills Analysis Tabs */}
                <Card>
                    <CardContent className="p-6">
                        <Tabs defaultValue="fluency" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-6">
                                <TabsTrigger value="fluency">
                                    Fluency
                                </TabsTrigger>
                                <TabsTrigger value="pronunciation">
                                    Pronunciation
                                </TabsTrigger>
                                <TabsTrigger value="vocabulary">
                                    Vocabulary
                                </TabsTrigger>
                                <TabsTrigger value="grammar">
                                    Grammar
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="fluency" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">
                                        Fluency Analysis
                                    </h3>
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                        7.5 / 9
                                    </Badge>
                                </div>
                                <Progress value={83} className="h-2" />

                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">
                                            Speaking Pace
                                        </p>
                                        <p className="font-medium">120 WPM</p>
                                        <p className="text-xs text-emerald-600">
                                            Good - Natural pace
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">
                                            Hesitations
                                        </p>
                                        <p className="font-medium">
                                            3 instances
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Minor - "um", "uh"
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">
                                            Self-corrections
                                        </p>
                                        <p className="font-medium">2 times</p>
                                        <p className="text-xs text-slate-500">
                                            Natural correction
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Other tab contents... */}
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Feedback Row */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Common Mistakes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Common Mistakes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-700 font-medium">
                                            "I have work there for two years"
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 mt-2">
                                    <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-emerald-700">
                                            "I worked there for two years"
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Use simple past for completed
                                            actions
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-500 mt-0.5" />
                                    <p className="text-sm text-red-700 font-medium">
                                        "More better solution"
                                    </p>
                                </div>
                                <div className="flex items-start gap-2 mt-2">
                                    <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-emerald-700">
                                            "A better solution" or "A much
                                            better solution"
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Avoid double comparatives
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Better Expressions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                Upgrade Your Expressions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-medium text-blue-600 mb-2">
                                    Instead of: "I think..."
                                </p>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-700">
                                        • "In my view..."
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        • "I believe that..."
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        • "From my perspective..."
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        • "It seems to me that..."
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-medium text-blue-600 mb-2">
                                    Instead of: "And then..."
                                </p>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-700">
                                        • "Subsequently..."
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        • "Following that..."
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        • "As a result..."
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
