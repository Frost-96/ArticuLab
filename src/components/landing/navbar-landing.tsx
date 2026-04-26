"use client";

import Link from "next/link";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
];

export function NavbarLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);

        handleScroll();
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeMenu = () => setMobileOpen(false);

    return (
        <>
            <header
                className={cn(
                    "fixed inset-x-0 top-0 z-50 transition-all duration-300",
                    scrolled
                        ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
                        : "bg-transparent",
                )}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex items-center justify-center rounded-xl bg-indigo-600 text-white transition-all",
                                scrolled ? "size-8" : "size-9",
                            )}
                        >
                            <Sparkles className="size-4" />
                        </div>
                        <span className="text-lg font-semibold text-slate-900">
                            ArticuLab
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        <Button variant="ghost" asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                            <Link href="/signup">
                                Get Started Free
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                        onClick={() => setMobileOpen((value) => !value)}
                    >
                        {mobileOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </Button>
                </div>
            </header>

            {mobileOpen ? (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation overlay"
                        className="absolute inset-0 bg-slate-950/20"
                        onClick={closeMenu}
                    />
                    <div className="animate-slide-down-fade absolute inset-x-0 top-16 border-b border-slate-200 bg-white shadow-lg">
                        <nav className="flex flex-col gap-1 p-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                    {link.label}
                                </a>
                            ))}

                            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/login" onClick={closeMenu}>
                                        Log In
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Link href="/signup" onClick={closeMenu}>
                                        Get Started Free
                                    </Link>
                                </Button>
                            </div>
                        </nav>
                    </div>
                </div>
            ) : null}
        </>
    );
}
