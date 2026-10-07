import { z } from "zod";

// UUID v4-style id used by Prisma's default uuid()
export const idParamSchema = z.object({
  id: z.string().uuid("Malformed id"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
