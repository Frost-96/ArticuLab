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
        description: "Perfect for trying out ArticuLab",
        monthlyPrice: 0,
        yearlyPrice: 0,
        cta: "Get Started Free",
        ctaVariant: "outline" as const,
        popular: false,
        features: [
            { text: "3 writing essays per month", included: true },
            { text: "5 speaking sessions per month", included: true },
            { text: "Basic AI feedback", included: true },
            { text: "AI Coach (10 messages/day)", included: true },
            { text: "Advanced annotations", included: false },
            { text: "Progress analytics", included: false },
            { text: "Export to PDF", included: false },
            { text: "Priority support", included: false },
        ],
    },
    {
        name: "Pro",
        description: "For serious learners preparing for exams",
        monthlyPrice: 19,
        yearlyPrice: 15,
        cta: "Start Pro Trial",
        ctaVariant: "default" as const,
        popular: true,
        features: [
            { text: "Unlimited writing essays", included: true },
            { text: "Unlimited speaking sessions", included: true },
            { text: "Advanced AI feedback + rewrites", included: true },
            { text: "Unlimited AI Coach", included: true },
            { text: "Inline annotations & tips", included: true },
            { text: "Full progress analytics", included: true },
            { text: "Export to PDF", included: true },
            { text: "Priority email support", included: true },
        ],
    },
];

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="bg-slate-50 py-20 sm:py-28">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        Pricing
                    </p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg leading-8 text-slate-600">
                        Start free and upgrade when you&apos;re ready for unlimited
                        practice.
                    </p>
                </div>

                <div className="mb-12 flex items-center justify-center">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setIsYearly(false)}
                            className={cn(
                                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                !isYearly
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsYearly(true)}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                                isYearly
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                        >
                            Yearly
                            <Badge className="border-0 bg-emerald-100 text-emerald-700">
                                -20%
                            </Badge>
                        </button>
                    </div>
                </div>

                <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                    {plans.map((plan) => {
                        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

                        return (
                            <div
                                key={plan.name}
                                className={cn(
                                    "relative rounded-3xl border-2 bg-white p-8 transition-shadow",
                                    plan.popular
                                        ? "border-indigo-500 shadow-xl shadow-indigo-100"
                                        : "border-slate-200",
                                )}
                            >
                                {plan.popular ? (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-indigo-600 px-4 py-1 text-sm text-white shadow-md">
                                            <Crown className="mr-1.5 size-3.5" />
                                            Most Popular
                                        </Badge>
                                    </div>
                                ) : null}

                                <div className="mb-6">
                                    <h3 className="mb-1 text-xl font-semibold text-slate-900">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-semibold text-slate-900">
                                            ${price}
                                        </span>
                                        <span className="text-slate-500">/month</span>
                                    </div>
                                    {isYearly && price > 0 ? (
                                        <p className="mt-1 text-sm text-emerald-600">
                                            Billed yearly (${price * 12}/year)
                                        </p>
                                    ) : null}
                                    {!isYearly && plan.monthlyPrice > 0 ? (
                                        <p className="mt-1 text-sm text-slate-400">
                                            Billed monthly
                                        </p>
                                    ) : null}
                                </div>

                                <Separator className="mb-6" />

                                <ul className="mb-8 space-y-3">
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
                                                <Check className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                                            ) : (
                                                <X className="mt-0.5 size-5 shrink-0 text-slate-300" />
                                            )}
                                            <span
                                                className={
                                                    feature.included ? "" : "line-through"
                                                }
                                            >
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    asChild
                                    variant={plan.ctaVariant}
                                    className={cn(
                                        "h-12 w-full text-base",
                                        plan.popular
                                            ? "bg-indigo-600 hover:bg-indigo-700"
                                            : "",
                                    )}
                                >
                                    <Link href="/signup">{plan.cta}</Link>
                                </Button>

                                {plan.popular ? (
                                    <p className="mt-3 text-center text-xs text-slate-400">
                                        7-day free trial • Cancel anytime
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 text-center text-sm text-slate-500">
                    Students with a valid academic email can unlock special pricing
                    when registration opens for campus offers.
                </div>
            </div>
        </section>
    );
}
