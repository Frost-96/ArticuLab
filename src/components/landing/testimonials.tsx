import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
    {
        name: "Sarah Chen",
        role: "IELTS Student",
        avatar: "SC",
        score: "Band 7.5",
        content:
            "ArticuLab helped me improve my writing score from 6.0 to 7.5 in two months. The inline annotations feel like having a tutor right beside me.",
        color: "bg-indigo-100 text-indigo-700",
    },
    {
        name: "Ahmed Hassan",
        role: "University Applicant",
        avatar: "AH",
        score: "TOEFL 105",
        content:
            "The speaking practice made me far more comfortable under pressure. I walked into my exam feeling rehearsed instead of nervous.",
        color: "bg-violet-100 text-violet-700",
    },
    {
        name: "Yuki Tanaka",
        role: "Business Professional",
        avatar: "YT",
        score: "Promoted",
        content:
            "I use the AI Coach during my commute. My business English improved enough that I was promoted to an international team.",
        color: "bg-emerald-100 text-emerald-700",
    },
    {
        name: "Maria Garcia",
        role: "Graduate Student",
        avatar: "MG",
        score: "Band 8.0",
        content:
            "The structure feedback changed how I organize essays. I went from struggling with coherence to writing with confidence.",
        color: "bg-amber-100 text-amber-700",
    },
    {
        name: "David Kim",
        role: "Software Engineer",
        avatar: "DK",
        score: "PTE 85",
        content:
            "Clear communication matters in my job, and the grammar corrections plus vocabulary suggestions improved my documentation fast.",
        color: "bg-rose-100 text-rose-700",
    },
    {
        name: "Priya Sharma",
        role: "Medical Student",
        avatar: "PS",
        score: "OET B",
        content:
            "I needed realistic medical communication practice, and ArticuLab gave me a safe way to rehearse patient conversations daily.",
        color: "bg-teal-100 text-teal-700",
    },
];

export function Testimonials() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mx-auto mb-14 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        Testimonials
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Loved by learners worldwide
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        Learners use ArticuLab to improve exam scores, workplace
                        communication, and everyday fluency.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.name}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg"
                        >
                            <div className="mb-4 flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className="size-4 fill-amber-400 text-amber-400"
                                    />
                                ))}
                            </div>

                            <p className="mb-5 flex-1 text-sm leading-7 text-slate-600">
                                &quot;{testimonial.content}&quot;
                            </p>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-9">
                                        <AvatarFallback
                                            className={`${testimonial.color} text-xs font-semibold`}
                                        >
                                            {testimonial.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {testimonial.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
                                    {testimonial.score}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
