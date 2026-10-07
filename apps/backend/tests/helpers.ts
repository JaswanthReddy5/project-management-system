import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

export async function registerUser(overrides: Partial<{ fullName: string; email: string; password: string }> = {}) {
  const payload = {
    fullName: overrides.fullName ?? "Test User",
    email: overrides.email ?? `user${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: overrides.password ?? "Password123!",
  };

  const res = await request(app).post("/api/auth/register").send(payload);
  return { res, token: res.body.token as string, user: res.body.user };
}

export async function createProject(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Default Project", ...overrides });
  return res;
}

export async function createTask(token: string, projectId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({ projectId, name: "Default Task", ...overrides });
  return res;
}
