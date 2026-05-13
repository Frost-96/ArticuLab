import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "How does ArticuLab's AI feedback compare to a real tutor?",
        answer:
            "ArticuLab is designed to deliver fast, structured feedback on grammar, vocabulary, clarity, and organization. It works best as a daily practice partner, and many learners combine it with occasional human feedback for even faster improvement.",
    },
    {
        question: "Is it really free to start?",
        answer:
            "Yes. The Free plan gives you limited writing reviews, speaking sessions, and AI Coach usage so you can explore the platform before upgrading.",
    },
    {
        question: "What exams does ArticuLab support?",
        answer:
            "The experience is designed around common English-learning and exam-prep workflows, including IELTS- and TOEFL-style writing and speaking practice.",
    },
    {
        question: "How does the speaking practice work?",
        answer:
            "You choose a scenario, respond with your voice, and receive feedback on fluency, clarity, grammar, and confidence. The marketing demo shows the experience style without relying on external audio assets.",
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer:
            "Yes. Paid plans are intended to be flexible, and you can stop using the service without being locked into a long-term commitment.",
    },
    {
        question: "Is my data private and secure?",
        answer:
            "We treat practice content as personal learning data and design the product around private, account-based usage.",
    },
    {
        question: "Do you offer student or group discounts?",
        answer:
            "Student and organization-friendly pricing can be supported as the product grows, and the homepage keeps that space visible for future expansion.",
    },
    {
        question: "What languages is the platform available in?",
        answer:
            "The product is focused on helping learners improve English, while keeping the interface and onboarding approachable for an international audience.",
    },
];

export function FAQSection() {
    return (
        <section id="faq" className="py-20 sm:py-28">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                <div className="mb-12 text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                        FAQ
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Frequently asked questions
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        Have more questions? Sign up and explore the product from
                        the inside.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={faq.question} value={`item-${index}`}>
                            <AccordionTrigger className="text-base font-medium text-slate-900 hover:no-underline hover:text-sky-600">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="leading-7 text-slate-600">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
