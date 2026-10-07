import { z } from "zod";

export const projectStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);

const dateField = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((val, ctx) => {
    if (val === undefined || val === null || val === "") return;
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
    }
  })
  .transform((val) => {
    if (val === undefined || val === null || val === "") return null;
    return new Date(val);
  });

function withDateOrderCheck<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
    if (data.startDate && data.endDate && data.endDate.getTime() < data.startDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate cannot be before startDate",
        path: ["endDate"],
      });
    }
  });
}

export const createProjectSchema = withDateOrderCheck(
  z.object({
    name: z.string().trim().min(1, "Project name is required").max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    status: projectStatusEnum.optional().default("NOT_STARTED"),
    startDate: dateField,
    endDate: dateField,
  })
);

export const updateProjectSchema = withDateOrderCheck(
  z.object({
    name: z.string().trim().min(1, "Project name cannot be blank").max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    status: projectStatusEnum.optional(),
    startDate: dateField,
    endDate: dateField,
  })
);

export const listProjectsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: projectStatusEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "createdAt", "startDate", "endDate", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
