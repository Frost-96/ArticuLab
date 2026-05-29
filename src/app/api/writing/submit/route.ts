import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitWritingSchema } from "@/schema/writing.schema";
import { getFirstError } from "@/lib/error";
import * as writingService from "@/server/services/writing.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Please login first" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = submitWritingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: getFirstError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await writingService.submitWritingForReview(
      user.userId,
      parsed.data,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit writing";
    const status = message.includes("not found")
      ? 404
      : message.startsWith("AI ")
        ? 502
        : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
