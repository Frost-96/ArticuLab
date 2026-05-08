import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WritingReview } from "@/components/writing/writing-review";
import { getWritingExercise } from "@/server/services/writing.service";

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
        ({ exercise } = await getWritingExercise(currentUser.userId, {
            exerciseId: id,
        }));
    } catch {
        redirect("/writing");
    }

    return <WritingReview exercise={exercise} />;
}
