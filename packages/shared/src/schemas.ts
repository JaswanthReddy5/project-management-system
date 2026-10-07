import { z } from "zod";

export const projectStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const taskStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    status: projectStatusEnum.default("NOT_STARTED"),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    },
    { message: "End date cannot be before start date", path: ["endDate"] }
  );
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const taskFormSchema = z.object({
  projectId: z.string().uuid("A project is required"),
  name: z.string().trim().min(1, "Task name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: taskStatusEnum.default("PENDING"),
  dueDate: z.string().optional().or(z.literal("")),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
