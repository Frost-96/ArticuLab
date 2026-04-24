import { getCurrentUser } from "@/lib/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
    const currentUser = await getCurrentUser();

    return (
        <OnboardingFlow
            initialEnglishLevel={currentUser?.englishLevel ?? null}
        />
    );
}
