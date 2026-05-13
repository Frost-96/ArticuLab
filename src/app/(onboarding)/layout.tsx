import { Sparkles } from "lucide-react";

export const metadata = {
    title: "Get Started - ArticuLab",
};

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
                <div className="flex h-full items-center justify-center px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-600">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-slate-900">
                            ArticuLab
                        </span>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 pb-10 pt-24">
                {children}
            </main>
        </div>
    );
}
