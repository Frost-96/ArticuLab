import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type FooterLink = {
    label: string;
    href?: string;
};

const footerLinks: Record<string, FooterLink[]> = {
    Product: [
        { label: "Writing Practice", href: "/writing" },
        { label: "Speaking Practice", href: "/speaking" },
        { label: "AI Coach", href: "/coach" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog" },
    ],
    Resources: [
        { label: "IELTS Guide" },
        { label: "TOEFL Guide" },
        { label: "Grammar Tips" },
        { label: "Blog" },
        { label: "Help Center" },
    ],
    Company: [
        { label: "About Us" },
        { label: "Careers" },
        { label: "Contact" },
        { label: "Partners" },
    ],
    Legal: [
        { label: "Privacy Policy" },
        { label: "Terms of Service" },
        { label: "Cookie Policy" },
    ],
};

const socialLinks = [
    { label: "X", href: "https://twitter.com/articulab", shortLabel: "X" },
    { label: "GitHub", href: "https://github.com/articulab", shortLabel: "GH" },
    { label: "YouTube", href: "https://youtube.com/@articulab", shortLabel: "YT" },
];

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-6">
                    <div className="col-span-2">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-sky-600 text-white">
                                <Sparkles className="size-4" />
                            </div>
                            <span className="text-lg font-semibold text-slate-900">
                                ArticuLab
                            </span>
                        </div>

                        <p className="mb-5 max-w-xs text-sm leading-7 text-slate-500">
                            AI-powered English writing and speaking practice for
                            learners who want clear feedback and steady progress.
                        </p>

                        <div className="flex items-center gap-3">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                                    aria-label={link.label}
                                >
                                    {link.shortLabel}
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="mb-4 text-sm font-semibold text-slate-900">
                                {category}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        {link.href ? (
                                            link.href.startsWith("#") ? (
                                                <a
                                                    href={link.href}
                                                    className="text-sm text-slate-500 transition-colors hover:text-sky-600"
                                                >
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={link.href}
                                                    className="text-sm text-slate-500 transition-colors hover:text-sky-600"
                                                >
                                                    {link.label}
                                                </Link>
                                            )
                                        ) : (
                                            <span className="text-sm text-slate-400">
                                                {link.label}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} ArticuLab. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        All systems operational
                    </div>
                </div>
            </div>
        </footer>
    );
}
