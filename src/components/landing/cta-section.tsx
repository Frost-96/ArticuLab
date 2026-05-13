import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
    return (
        <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-24">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8 inline-flex size-14 items-center justify-center rounded-lg bg-white/10">
                    <Sparkles className="size-7 text-white" />
                </div>

                <h2 className="mb-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Build a steady English practice loop
                </h2>

                <p className="mx-auto mb-10 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                    Practice writing, rehearse speaking scenarios, get focused
                    feedback, and return to the next session knowing what to improve.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button
                        size="lg"
                        asChild
                        className="h-12 w-full bg-white px-8 text-base font-semibold text-sky-700 shadow-sm hover:bg-sky-50 sm:w-auto"
                    >
                        <Link href="/signup">
                            Get started for free
                            <ArrowRight className="ml-1 size-5" />
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="h-12 w-full border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    >
                        <a href="#pricing">View pricing</a>
                    </Button>
                </div>

                <p className="mt-6 text-sm text-slate-400">
                    No credit card required. Free plan available.
                </p>
            </div>
        </section>
    );
}
