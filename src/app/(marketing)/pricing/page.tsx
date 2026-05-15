import type { Metadata } from "next";
import { PricingSection } from "@/components/landing/pricing-section";

export const metadata: Metadata = {
    title: "Pricing - ArticuLab",
    description:
        "Choose a simple ArticuLab plan for AI English writing review, speaking practice, and coaching.",
};

export default function PricingPage() {
    return <PricingSection standalone />;
}
