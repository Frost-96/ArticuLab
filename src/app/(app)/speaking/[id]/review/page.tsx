import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SpeakingReview } from "@/components/speaking/speaking-review";
import { getSpeakingExercise } from "@/server/services/speaking.service";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/login");
    }

    const { id } = await params;
    let exercise;

    try {
        ({ exercise } = await getSpeakingExercise(currentUser.userId, { id }));
    } catch {
        redirect("/speaking");
    }

    return <SpeakingReview exercise={exercise} />;
}
