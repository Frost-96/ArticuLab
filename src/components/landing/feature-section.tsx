import {
    BarChart3,
    BookOpen,
    MessageSquare,
    Mic,
    PenLine,
    Shield,
    Target,
    Zap,
} from "lucide-react";

const mainFeatures = [
    {
        icon: PenLine,
        title: "AI Writing Review",
        description:
            "Submit essays and get IELTS- and TOEFL-style scoring with inline grammar corrections, vocabulary suggestions, and structure improvements.",
        color: "bg-indigo-100 text-indigo-600",
        highlights: [
            "Band score estimation",
            "Inline annotations",
            "Rewrite suggestions",
        ],
    },
    {
        icon: Mic,
        title: "Speaking Practice",
        description:
            "Practice real conversation scenarios with AI that listens and responds naturally, from interviews to exam-style speaking prompts.",
        color: "bg-violet-100 text-violet-600",
        highlights: ["Voice recognition", "Fluency analysis", "Pronunciation tips"],
    },
    {
        icon: MessageSquare,
        title: "AI Coach Chat",
        description:
            "Ask grammar questions, get vocabulary help, practice phrases, or have a conversation to improve fluency whenever inspiration strikes.",
        color: "bg-emerald-100 text-emerald-600",
        highlights: ["Instant answers", "Grammar explanations", "Context examples"],
    },
    {
        icon: BarChart3,
        title: "Progress Analytics",
        description:
            "Track improvement over time with score trends, weakness detection, and guidance on what to practice next.",
        color: "bg-amber-100 text-amber-600",
        highlights: ["Trend tracking", "Skill insights", "Practice recommendations"],
    },
];

const supportingFeatures = [
    {
        icon: Zap,
        title: "Instant Feedback",
        description: "Get corrections and scores in seconds, not days.",
    },
    {
        icon: Target,
        title: "Exam-Focused",
        description: "Practice formats tailored to IELTS, TOEFL, PTE, and more.",
    },
    {
        icon: BookOpen,
        title: "Daily Prompts",
        description: "Fresh writing and speaking prompts generated every day.",
    },
    {
        icon: Shield,
        title: "Private & Secure",
        description: "Your practice stays yours and is handled with care.",
    },
];

export function FeatureSection() {
    return (
        <section id="features" className="bg-slate-50 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        Features
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Everything you need to master English
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        A complete learning system that combines writing practice,
                        speaking scenarios, and AI coaching into one experience.
                    </p>
                </div>

                <div className="mb-16 grid gap-6 md:grid-cols-2">
                    {mainFeatures.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl sm:p-8"
                        >
                            <div
                                className={`mb-5 flex size-12 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}
                            >
                                <feature.icon className="size-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-slate-900">
                                {feature.title}
                            </h3>
                            <p className="mb-4 leading-7 text-slate-600">
                                {feature.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {feature.highlights.map((highlight) => (
                                    <span
                                        key={highlight}
                                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                    >
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {supportingFeatures.map((feature) => (
                        <div
                            key={feature.title}
                            className="text-center sm:text-left"
                        >
                            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0">
                                <feature.icon className="size-5 text-indigo-600" />
                            </div>
                            <h4 className="mb-1 font-semibold text-slate-900">
                                {feature.title}
                            </h4>
                            <p className="text-sm leading-6 text-slate-500">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
