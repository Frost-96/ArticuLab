import { z } from "zod";

// ==================== 閫氱敤鏍￠獙 ====================

// Accept the ID formats used by the application and seed data.
export const idSchema = z.union(
    [z.cuid(), z.cuid2(), z.uuid()],
    "ID must be a valid CUID, CUID2, or UUID",
);

// 鍒嗛〉鍙傛暟
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// 鏃堕棿鑼冨洿绛涢€?
export const dateRangeSchema = z
    .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    })
    .refine(
        (data) => {
            if (data.from && data.to) return data.from <= data.to;
            return true;
        },
        { message: "Start date cannot be later than end date" },
    );

// 缁熶竴 Action 杩斿洖绫诲瀷
export const actionResultSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.discriminatedUnion("success", [
        z.object({ success: z.literal(true), data: dataSchema }),
        z.object({ success: z.literal(false), error: z.string() }),
    ]);

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export type PaginationParams = z.infer<typeof paginationSchema>;
