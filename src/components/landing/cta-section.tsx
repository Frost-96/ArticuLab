import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 py-20 sm:py-28">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute left-10 top-10 h-40 w-40 rounded-full border-2 border-white" />
                <div className="absolute bottom-20 right-20 h-60 w-60 rounded-full border-2 border-white" />
                <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
                <div className="mb-8 inline-flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Sparkles className="size-8 text-white" />
                </div>

                <h2 className="mb-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Ready to transform your
                    <br />
                    English skills?
                </h2>

                <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-indigo-100 sm:text-xl">
                    Join learners improving their writing and speaking every day
                    with AI-powered practice and feedback.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button
                        size="lg"
                        asChild
                        className="h-12 w-full bg-white px-8 text-base font-semibold text-indigo-700 shadow-xl hover:bg-indigo-50 sm:w-auto"
                    >
                        <Link href="/signup">
                            Get Started for Free
                            <ArrowRight className="ml-1 size-5" />
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="h-12 w-full border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    >
                        <a href="#pricing">View Pricing</a>
                    </Button>
                </div>

                <p className="mt-6 text-sm text-indigo-200">
                    No credit card required • Free plan available
                </p>
            </div>
        </section>
    );
}
