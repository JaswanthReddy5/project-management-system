import type { DashboardStats, Pagination, Project, ProjectWithTasks, Task, User } from "@pms/shared";
import { apiFetch } from "./api";

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: (input: { fullName: string; email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/register", { method: "POST", body: input, skipAuth: true }),
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: input, skipAuth: true }),
  logout: () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<{ user: User }>("/auth/me"),
};

export interface ProjectsListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const projectsApi = {
  list: (params: ProjectsListParams = {}) =>
    apiFetch<{ data: Project[]; pagination: Pagination }>("/projects", { query: params as Record<string, unknown> }),
  get: (id: string) => apiFetch<{ data: ProjectWithTasks }>(`/projects/${id}`),
  create: (input: Record<string, unknown>) =>
    apiFetch<{ data: Project }>("/projects", { method: "POST", body: input }),
  update: (id: string, input: Record<string, unknown>) =>
    apiFetch<{ data: Project }>(`/projects/${id}`, { method: "PUT", body: input }),
  remove: (id: string) => apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
};

export interface TasksListParams {
  search?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const tasksApi = {
  list: (params: TasksListParams = {}) =>
    apiFetch<{ data: Task[]; pagination: Pagination }>("/tasks", { query: params as Record<string, unknown> }),
  get: (id: string) => apiFetch<{ data: Task }>(`/tasks/${id}`),
  create: (input: Record<string, unknown>) => apiFetch<{ data: Task }>("/tasks", { method: "POST", body: input }),
  update: (id: string, input: Record<string, unknown>) =>
    apiFetch<{ data: Task }>(`/tasks/${id}`, { method: "PUT", body: input }),
  remove: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export const dashboardApi = {
  get: () => apiFetch<{ data: DashboardStats }>("/dashboard"),
};
