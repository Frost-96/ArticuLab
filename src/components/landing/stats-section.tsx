const stats = [
    {
        value: "10,000+",
        label: "Active learners",
        description: "across 50+ countries",
    },
    {
        value: "500K+",
        label: "Essays reviewed",
        description: "by our AI system",
    },
    {
        value: "4.9/5",
        label: "User rating",
        description: "based on learner reviews",
    },
    {
        value: "1.2pt",
        label: "Avg. score improvement",
        description: "within the first 30 days",
    },
];

export function StatsSection() {
    return (
        <section className="border-y border-slate-200 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="mb-1 text-3xl font-semibold text-indigo-600 sm:text-4xl">
                                {stat.value}
                            </p>
                            <p className="font-medium text-slate-900">
                                {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
