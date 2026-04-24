import { CTASection } from "@/components/landing/cta-section";
import { DemoSection } from "@/components/landing/demo-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { StatsSection } from "@/components/landing/stats-section";
import { Testimonials } from "@/components/landing/testimonials";

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <FeatureSection />
            <HowItWorks />
            <DemoSection />
            <StatsSection />
            <Testimonials />
            <PricingSection />
            <FAQSection />
            <CTASection />
        </>
    );
}
