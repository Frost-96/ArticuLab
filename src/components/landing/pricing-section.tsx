"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Crown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Free",
        description: "For getting started with structured practice.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        cta: "Get started free",
        ctaVariant: "outline" as const,
        popular: false,
        features: [
            { text: "3 writing essays per month", included: true },
            { text: "5 speaking sessions per month", included: true },
            { text: "Basic AI feedback", included: true },
            { text: "AI Coach, 10 messages/day", included: true },
            { text: "Advanced inline annotations", included: false },
            { text: "Progress analytics", included: false },
            { text: "PDF export", included: false },
            { text: "Priority support", included: false },
        ],
    },
    {
        name: "Pro",
        description: "For serious learners preparing for exams.",
        monthlyPrice: 19,
        yearlyPrice: 15,
        cta: "Start Pro trial",
        ctaVariant: "default" as const,
        popular: true,
        features: [
            { text: "Unlimited writing essays", included: true },
            { text: "Unlimited speaking sessions", included: true },
            { text: "Advanced AI feedback and rewrites", included: true },
            { text: "Unlimited AI Coach", included: true },
            { text: "Inline annotations and tips", included: true },
            { text: "Full progress analytics", included: true },
            { text: "PDF export", included: true },
            { text: "Priority email support", included: true },
        ],
    },
];

type PricingSectionProps = {
    standalone?: boolean;
};

export function PricingSection({ standalone = false }: PricingSectionProps) {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section
            id="pricing"
            className={cn(
                "bg-white",
                standalone ? "px-4 pb-16 pt-24 sm:px-6 sm:pt-28" : "px-4 py-20 sm:px-6 sm:py-24",
            )}
        >
            <div className="mx-auto max-w-5xl">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                    <p className="section-eyebrow">Pricing</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        Simple plans for consistent English practice
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                        Start with the free plan, then upgrade when you need unlimited
                        reviews, richer analytics, and deeper coaching.
                    </p>
                </div>

                <div className="mb-8 flex items-center justify-center">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                            type="button"
                            onClick={() => setIsYearly(false)}
                            className={cn(
                                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                !isYearly
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-600 hover:text-slate-950",
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsYearly(true)}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                isYearly
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-600 hover:text-slate-950",
                            )}
                        >
                            Yearly
                            <Badge className="border-0 bg-emerald-100 text-emerald-700">
                                Save 20%
                            </Badge>
                        </button>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {plans.map((plan) => {
                        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

                        return (
                            <div
                                key={plan.name}
                                className={cn(
                                    "relative rounded-lg border bg-white p-6 shadow-sm",
                                    plan.popular
                                        ? "border-sky-300 ring-2 ring-sky-100"
                                        : "border-slate-200",
                                )}
                            >
                                {plan.popular ? (
                                    <Badge className="absolute right-4 top-4 bg-sky-600 text-white">
                                        <Crown className="mr-1.5 size-3.5" />
                                        Recommended
                                    </Badge>
                                ) : null}

                                <div className="pr-24">
                                    <h3 className="text-xl font-semibold text-slate-950">
                                        {plan.name}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-semibold text-slate-950">
                                            ${price}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            /month
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {price > 0
                                            ? isYearly
                                                ? `Billed yearly at $${price * 12}.`
                                                : "Billed monthly."
                                            : "No credit card required."}
                                    </p>
                                </div>

                                <Separator className="my-6" />

                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature.text}
                                            className={cn(
                                                "flex items-start gap-3 text-sm",
                                                feature.included
                                                    ? "text-slate-700"
                                                    : "text-slate-400",
                                            )}
                                        >
                                            {feature.included ? (
                                                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                            ) : (
                                                <X className="mt-0.5 size-4 shrink-0 text-slate-300" />
                                            )}
                                            <span>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    asChild
                                    variant={plan.ctaVariant}
                                    className={cn(
                                        "mt-8 h-10 w-full",
                                        plan.popular
                                            ? "bg-sky-600 hover:bg-sky-700"
                                            : "",
                                    )}
                                >
                                    <Link href="/signup">{plan.cta}</Link>
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-6 text-slate-500">
                    Campus and cohort pricing can be supported for schools and
                    language programs when registration opens for organizations.
                </p>
            </div>
        </section>
    );
}
