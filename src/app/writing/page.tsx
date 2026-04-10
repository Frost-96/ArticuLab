import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Pencil, Timer } from "lucide-react";

export default function Page() {
    return (
        // Route: app/writing/page.tsx (mode selection)

        <div className="max-w-2xl mx-auto p-6 pt-12">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                    Start Writing Practice
                </h1>
                <p className="text-slate-500">
                    Choose your practice mode to begin
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Exam Mode */}
                <Card className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                            <Timer className="w-6 h-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-lg">Exam Mode</CardTitle>
                        <CardDescription>
                            Simulate real IELTS/TOEFL conditions with timer
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Timed practice (40 mins)</li>
                            <li>• Random or custom prompts</li>
                            <li>• Full scoring rubric</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Daily Mode */}
                <Card className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                            <Pencil className="w-6 h-6 text-emerald-600" />
                        </div>
                        <CardTitle className="text-lg">
                            Daily Practice
                        </CardTitle>
                        <CardDescription>
                            Relaxed practice with AI-selected prompts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• No time limit</li>
                            <li>• Daily curated topics</li>
                            <li>• Focus on improvement</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
