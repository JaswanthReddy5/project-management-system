import { z } from "zod";

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const taskStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

const dueDateField = z
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

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Malformed projectId"),
  name: z.string().trim().min(1, "Task name is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: taskPriorityEnum.optional().default("MEDIUM"),
  status: taskStatusEnum.optional().default("PENDING"),
  dueDate: dueDateField,
});

export const updateTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name cannot be blank").max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: dueDateField,
});

export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "createdAt", "dueDate", "priority", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
