// src/validators/shared.ts

import { z } from "zod";

// ==================== 通用校验 ====================

// CUID2 格式 ID（Prisma 默认生成格式）
export const idSchema = z.cuid2("ID must be a valid CUID2");

// 分页参数
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// 时间范围筛选
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

// 统一 Action 返回类型
export const actionResultSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.discriminatedUnion("success", [
        z.object({ success: z.literal(true), data: dataSchema }),
        z.object({ success: z.literal(false), error: z.string() }),
    ]);

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export type PaginationParams = z.infer<typeof paginationSchema>;
