import { BarChart3, PenLine, Sparkles, TrendingUp } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: PenLine,
        title: "Practice",
        description:
            "Choose a writing prompt or speaking scenario and start a session that feels close to the real thing.",
        color: "from-indigo-500 to-indigo-600",
    },
    {
        number: "02",
        icon: Sparkles,
        title: "Get Feedback",
        description:
            "Receive instant AI-powered corrections on grammar, vocabulary, structure, and pronunciation with explanations.",
        color: "from-violet-500 to-violet-600",
    },
    {
        number: "03",
        icon: BarChart3,
        title: "Review & Analyze",
        description:
            "See scores, inline annotations, and concrete suggestions that show what to fix next.",
        color: "from-emerald-500 to-emerald-600",
    },
    {
        number: "04",
        icon: TrendingUp,
        title: "Improve",
        description:
            "Track progress over time and focus on the practice that moves your scores and confidence forward.",
        color: "from-amber-500 to-amber-600",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        How It Works
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        From practice to progress in four steps
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        A simple loop designed to help learners improve faster with
                        focused practice and actionable feedback.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative text-center">
                            {index < steps.length - 1 ? (
                                <div className="absolute left-[calc(50%+32px)] top-10 hidden h-0.5 w-[calc(100%-32px)] lg:block">
                                    <div className="relative h-full w-full bg-slate-200">
                                        <div className="absolute right-0 top-1/2 size-2 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-slate-300" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="relative mb-5 inline-flex">
                                <div
                                    className={`flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br ${step.color} shadow-lg`}
                                >
                                    <step.icon className="size-7 text-white" />
                                </div>
                                <div className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm">
                                    {step.number}
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                {step.title}
                            </h3>
                            <p className="text-sm leading-7 text-slate-500">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
