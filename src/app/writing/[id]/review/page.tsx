import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ArrowLeft,
    ChevronDown,
    Download,
    Lightbulb,
    Link,
} from "lucide-react";

export default function Page() {
    // Score Row Component
    function ScoreRow({ label, score }: { label: string; score: number }) {
        const percentage = (score / 9) * 100;
        return (
            <div>
                <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-900">
                        {score.toFixed(1)}
                    </span>
                </div>
                <Progress value={percentage} className="h-2" />
            </div>
        );
    }

    return (
        // Route: app/writing/[id]/review/page.tsx

        <div className="min-h-[calc(100vh-56px)] bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/writing">
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to Writing
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Essay Review
                        </h1>
                        <p className="text-sm text-slate-500">
                            IELTS Task 2 • Submitted 2 hours ago
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Practice Again
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                <div className="flex gap-6">
                    {/* Left Panel - Scores */}
                    <aside className="w-80 shrink-0 space-y-4">
                        {/* Overall Score Card */}
                        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                            <CardContent className="p-6 text-center">
                                <p className="text-indigo-200 text-sm mb-2">
                                    Overall Band Score
                                </p>
                                <div className="text-5xl font-bold mb-1">
                                    7.5
                                </div>
                                <p className="text-indigo-200 text-sm">
                                    out of 9.0
                                </p>
                                <div className="mt-4 flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <div
                                            key={i}
                                            className="w-3 h-3 rounded-full bg-white"
                                        />
                                    ))}
                                    <div className="w-3 h-3 rounded-full bg-white/50" />
                                    <div className="w-3 h-3 rounded-full bg-white/30" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sub-Scores */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Score Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ScoreRow
                                    label="Grammar & Accuracy"
                                    score={7.0}
                                />
                                <ScoreRow
                                    label="Vocabulary Range"
                                    score={8.0}
                                />
                                <ScoreRow
                                    label="Coherence & Cohesion"
                                    score={7.5}
                                />
                                <ScoreRow
                                    label="Task Achievement"
                                    score={7.0}
                                />
                            </CardContent>
                        </Card>

                        {/* Key Improvements */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    Key Improvements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                        <span className="text-slate-600">
                                            Use more sophisticated linking words
                                            between paragraphs
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <span className="text-slate-600">
                                            Vary sentence structures to improve
                                            band score
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <span className="text-slate-600">
                                            Include more specific examples in
                                            body paragraphs
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Sample Rewrites */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Sample Improvements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Collapsible>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-lg text-sm">
                                        <span>Improved Introduction</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
                                        "In contemporary society, technology has
                                        become inexorably intertwined with
                                        virtually every aspect of daily life..."
                                    </CollapsibleContent>
                                </Collapsible>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Right Panel - Annotated Essay */}
                    <div className="flex-1">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-base">
                                    Annotated Essay
                                </CardTitle>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-red-500" />
                                        Errors (3)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                                        Suggestions (5)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                                        Tips (2)
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <article className="prose prose-slate max-w-none">
                                    <p className="text-slate-700 leading-relaxed">
                                        Technology has become
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="bg-red-100 border-b-2 border-red-400 px-0.5 cursor-pointer">
                                                    an important
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm p-3">
                                                <p className="font-medium text-red-700 mb-1">
                                                    Grammar Issue
                                                </p>
                                                <p className="text-sm">
                                                    Consider using "an integral"
                                                    or "a crucial" for a higher
                                                    band score.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>{" "}
                                        part of modern society. While some argue
                                        that it has
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="bg-amber-100 border-b-2 border-amber-400 px-0.5 cursor-pointer">
                                                    made life easier
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm p-3">
                                                <p className="font-medium text-amber-700 mb-1">
                                                    Vocabulary Suggestion
                                                </p>
                                                <p className="text-sm">
                                                    Try "streamlined daily
                                                    activities" or "enhanced
                                                    efficiency" for more
                                                    sophisticated vocabulary.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                        , others believe it has introduced new
                                        complexities.
                                    </p>

                                    <p className="text-slate-700 leading-relaxed mt-4">
                                        Firstly, technology has undoubtedly
                                        simplified many aspects of our lives.
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="bg-blue-100 border-b-2 border-blue-400 px-0.5 cursor-pointer">
                                                    For example
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm p-3">
                                                <p className="font-medium text-blue-700 mb-1">
                                                    💡 Advanced Tip
                                                </p>
                                                <p className="text-sm">
                                                    Vary your examples with
                                                    phrases like "To
                                                    illustrate," or "A case in
                                                    point is..."
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                        , smartphones allow us to communicate
                                        instantly, access information, and
                                        manage daily tasks with unprecedented
                                        convenience...
                                    </p>
                                </article>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
