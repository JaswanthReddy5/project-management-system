import type { ProjectStatus, TaskPriority, TaskStatus } from "@pms/shared";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const projectStatusColor: Record<ProjectStatus, string> = {
  NOT_STARTED: "#64748b",
  IN_PROGRESS: "#2563eb",
  COMPLETED: "#059669",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const taskStatusColor: Record<TaskStatus, string> = {
  PENDING: "#d97706",
  IN_PROGRESS: "#2563eb",
  COMPLETED: "#059669",
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const taskPriorityColor: Record<TaskPriority, string> = {
  LOW: "#64748b",
  MEDIUM: "#d97706",
  HIGH: "#e11d48",
};

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong";
}
