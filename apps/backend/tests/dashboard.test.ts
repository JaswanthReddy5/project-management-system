import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createProject, createTask } from "./helpers";

describe("Dashboard", () => {
  it("computes correct statistics for the authenticated user", async () => {
    const { token } = await registerUser();
    const p1 = await createProject(token, { name: "P1", status: "IN_PROGRESS" });
    const p2 = await createProject(token, { name: "P2", status: "COMPLETED" });

    await createTask(token, p1.body.data.id, { name: "T1", status: "COMPLETED" });
    await createTask(token, p1.body.data.id, { name: "T2", status: "PENDING" });
    await createTask(token, p2.body.data.id, { name: "T3", status: "PENDING" });

    const res = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBe(2);
    expect(res.body.data.totalTasks).toBe(3);
    expect(res.body.data.completedTasks).toBe(1);
    expect(res.body.data.pendingTasks).toBe(2);
    expect(res.body.data.projectsInProgress).toBe(1);
  });

  it("isolates dashboard statistics per user", async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    const projectA = await createProject(userA.token, { name: "A Project" });
    await createTask(userA.token, projectA.body.data.id, { name: "A Task", status: "COMPLETED" });

    const resB = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${userB.token}`);
    expect(resB.body.data.totalProjects).toBe(0);
    expect(resB.body.data.totalTasks).toBe(0);
    expect(resB.body.data.completedTasks).toBe(0);

    const resA = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${userA.token}`);
    expect(resA.body.data.totalProjects).toBe(1);
    expect(resA.body.data.totalTasks).toBe(1);
    expect(resA.body.data.completedTasks).toBe(1);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
  });
});
