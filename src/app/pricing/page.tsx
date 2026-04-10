import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge, Check, Star, X } from "lucide-react";

export default function Page() {
    return (
        // Route: app/pricing/page.tsx

        <div className="min-h-[calc(100vh-56px)] bg-white">
            {/* Hero Section */}
            <section className="py-16 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-slate-600 mb-8">
                        Start free and upgrade when you need more practice
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1 bg-slate-100 rounded-full">
                        {/* <button
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition",
                                isMonthly
                                    ? "bg-white shadow-sm text-slate-900"
                                    : "text-slate-600",
                            )}
                        >
                            Monthly
                        </button> */}
                        {/* <button
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2",
                                !isMonthly
                                    ? "bg-white shadow-sm text-slate-900"
                                    : "text-slate-600",
                            )}
                        >
                            Yearly
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                -20%
                            </Badge>
                        </button> */}
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-16 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-2 gap-8">
                    {/* Free Plan */}
                    <Card className="relative">
                        <CardHeader>
                            <CardTitle>Free</CardTitle>
                            <CardDescription>
                                Perfect for trying out ArticuLab
                            </CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>3 writing essays per month</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>5 speaking sessions per month</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Basic AI feedback</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>AI Coach (10 messages/day)</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-400">
                                    <X className="w-4 h-4" />
                                    <span>Progress analytics</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-400">
                                    <X className="w-4 h-4" />
                                    <span>Export to PDF</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                Get Started
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="relative border-indigo-200 shadow-lg">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-indigo-600 text-white px-3 py-1">
                                ⭐ Most Popular
                            </Badge>
                        </div>
                        <CardHeader>
                            <CardTitle>Pro</CardTitle>
                            <CardDescription>
                                For serious learners preparing for exams
                            </CardDescription>
                            {/* <div className="mt-4">
                                <span className="text-4xl font-bold">
                                    ${isMonthly ? 19 : 15}
                                </span>
                                <span className="text-slate-500">/month</span>
                                {!isMonthly && (
                                    <p className="text-sm text-emerald-600 mt-1">
                                        Billed yearly ($180/year)
                                    </p>
                                )}
                            </div> */}
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="font-medium">
                                        Unlimited writing essays
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="font-medium">
                                        Unlimited speaking sessions
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>
                                        Advanced AI feedback with rewrites
                                    </span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Unlimited AI Coach</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Full progress analytics</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Export to PDF</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Priority support</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                Upgrade to Pro
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-12 px-6 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-slate-600 mb-2">
                        Trusted by 10,000+ English learners worldwide
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                                key={i}
                                className="w-5 h-5 fill-amber-400 text-amber-400"
                            />
                        ))}
                        <span className="ml-2 font-medium">4.9/5</span>
                    </div>
                    <div className="flex items-center justify-center gap-8 mt-6 opacity-60">
                        {/* University/company logos placeholder */}
                    </div>
                </div>
            </section>

            {/* FAQ (Optional) */}
            <section className="py-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-semibold text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                Can I cancel anytime?
                            </AccordionTrigger>
                            <AccordionContent>
                                Yes, you can cancel your subscription at any
                                time. Your access will continue until the end of
                                your billing period.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                Is there a student discount?
                            </AccordionTrigger>
                            <AccordionContent>
                                Yes! Students with a valid .edu email get 30%
                                off. Contact support to apply the discount.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                What payment methods do you accept?
                            </AccordionTrigger>
                            <AccordionContent>
                                We accept all major credit cards, PayPal, and
                                bank transfers for yearly plans.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
        </div>
    );
}
