import z from "zod";

export function getFirstError(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Unknown validation error";
}
