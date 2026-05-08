import { getFirstError } from "@/lib/error";
import {
    createEmailVerificationSchema,
    deleteEmailVerificationSchema,
    getEmailVerificationByTokenSchema,
    getEmailVerificationSchema,
    markEmailVerificationUsedSchema,
    type CreateEmailVerificationInput,
    type DeleteEmailVerificationInput,
    type EmailVerificationType,
    type GetEmailVerificationByTokenInput,
    type GetEmailVerificationInput,
    type MarkEmailVerificationUsedInput,
} from "@/schema";
import * as emailVerificationRepo from "@/server/repositories/email-verification.repository";
import * as userRepo from "@/server/repositories/user.repository";

type EmailVerificationRecord = NonNullable<
    Awaited<
        ReturnType<typeof emailVerificationRepo.findEmailVerificationById>
    >
>;

export type EmailVerificationDetail = {
    id: string;
    userId: string;
    email: string;
    token: string;
    type: EmailVerificationType;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
};

function mapEmailVerification(
    record: EmailVerificationRecord,
): EmailVerificationDetail {
    return {
        id: record.id,
        userId: record.userId,
        email: record.email,
        token: record.token,
        type: record.type as EmailVerificationType,
        expiresAt: record.expiresAt.toISOString(),
        usedAt: record.usedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
    };
}

async function assertUserExists(userId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }
}

export async function createEmailVerification(
    input: CreateEmailVerificationInput,
): Promise<{ emailVerification: EmailVerificationDetail }> {
    const parsedInput = createEmailVerificationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    await assertUserExists(parsedInput.data.userId);
    const emailVerification =
        await emailVerificationRepo.createEmailVerification(parsedInput.data);

    return { emailVerification: mapEmailVerification(emailVerification) };
}

export async function getEmailVerification(
    input: GetEmailVerificationInput,
): Promise<{ emailVerification: EmailVerificationDetail }> {
    const parsedInput = getEmailVerificationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const emailVerification =
        await emailVerificationRepo.findEmailVerificationById(
            parsedInput.data.id,
        );
    if (!emailVerification) {
        throw new Error("Email verification not found");
    }

    return { emailVerification: mapEmailVerification(emailVerification) };
}

export async function getEmailVerificationByToken(
    input: GetEmailVerificationByTokenInput,
): Promise<{ emailVerification: EmailVerificationDetail }> {
    const parsedInput = getEmailVerificationByTokenSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const emailVerification =
        await emailVerificationRepo.findEmailVerificationByToken(
            parsedInput.data.token,
        );
    if (!emailVerification) {
        throw new Error("Email verification not found");
    }

    return { emailVerification: mapEmailVerification(emailVerification) };
}

export async function markEmailVerificationUsed(
    input: MarkEmailVerificationUsedInput,
): Promise<{ emailVerification: EmailVerificationDetail }> {
    const parsedInput = markEmailVerificationUsedSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await emailVerificationRepo.findEmailVerificationById(
        parsedInput.data.id,
    );
    if (!existing) {
        throw new Error("Email verification not found");
    }

    const emailVerification =
        await emailVerificationRepo.markEmailVerificationUsed(
            existing.id,
            parsedInput.data.usedAt ?? new Date(),
        );

    return { emailVerification: mapEmailVerification(emailVerification) };
}

export async function deleteEmailVerification(
    input: DeleteEmailVerificationInput,
): Promise<{ id: string }> {
    const parsedInput = deleteEmailVerificationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await emailVerificationRepo.findEmailVerificationById(
        parsedInput.data.id,
    );
    if (!existing) {
        throw new Error("Email verification not found");
    }

    return emailVerificationRepo.deleteEmailVerification(existing.id);
}

export async function deleteExpiredEmailVerifications(
    now = new Date(),
): Promise<{ count: number }> {
    const result =
        await emailVerificationRepo.deleteExpiredEmailVerifications(now);
    return { count: result.count };
}
