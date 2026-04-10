import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Clock,
    FileText,
    Link,
} from "lucide-react";

export default function Page() {
    const wordCount = 128; // Example word count
    const charCount = 654; // Example character count

    return (
        // Route: app/writing/[id]/page.tsx

        <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex flex-col">
            {/* Header Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/writing">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>

                    <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700"
                    >
                        Exam Mode
                    </Badge>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-sm font-medium">
                            38:42
                        </span>
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Saved</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Prompt Card */}
                    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-indigo-600 text-white">
                                    IELTS Task 2
                                </Badge>
                                <Badge variant="outline">Academic</Badge>
                            </div>
                            <CardTitle className="text-lg">
                                Writing Prompt
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 leading-relaxed">
                                Some people believe that technology has made our
                                lives more complicated, while others think it
                                has simplified many aspects of daily living.
                                Discuss both views and give your opinion.
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    Minimum 250 words
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    40 minutes recommended
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Editor Area */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <Textarea
                                placeholder="Start writing your essay here..."
                                className="min-h-[500px] border-0 focus-visible:ring-0 resize-none p-6 text-base leading-relaxed"
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer Bar */}
            <footer className="bg-white border-t border-slate-200 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Word Count */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                                Words:
                            </span>
                            <span
                                className={cn(
                                    "font-mono text-sm font-medium",
                                    wordCount >= 250
                                        ? "text-emerald-600"
                                        : "text-amber-600",
                                )}
                            >
                                {wordCount}/250
                            </span>
                            <Progress
                                value={(wordCount / 250) * 100}
                                className="w-24 h-2"
                            />
                        </div>

                        {/* Character Count */}
                        <div className="text-sm text-slate-400">
                            {charCount} characters
                        </div>
                    </div>

                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Submit for Review
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
