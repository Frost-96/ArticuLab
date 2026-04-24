import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { NavbarLanding } from "@/components/landing/navbar-landing";

export const metadata: Metadata = {
    title: "ArticuLab - AI English Writing & Speaking Assistant",
    description:
        "Master English writing and speaking with AI-powered feedback. Practice essays and conversations, get instant corrections, and improve with personalized coaching.",
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white text-slate-950">
            <NavbarLanding />
            <main>{children}</main>
            <Footer />
        </div>
    );
}
