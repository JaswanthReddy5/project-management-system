import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createProject, createTask } from "./helpers";

describe("Tasks", () => {
  it("creates a task under a project owned by the user", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const res = await createTask(token, project.body.data.id, { name: "Do the thing", priority: "HIGH" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Do the thing");
    expect(res.body.data.priority).toBe("HIGH");
    expect(res.body.data.status).toBe("PENDING");
  });

  it("rejects creating a task under another user's project", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const project = await createProject(userA.token);

    const res = await createTask(userB.token, project.body.data.id, { name: "Sneaky" });
    expect(res.status).toBe(400);
  });

  it("rejects a task with a blank name", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const res = await createTask(token, project.body.data.id, { name: "" });
    expect(res.status).toBe(422);
  });

  it("rejects a task with invalid priority enum", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const res = await createTask(token, project.body.data.id, { name: "X", priority: "URGENT" });
    expect(res.status).toBe(422);
  });

  it("rejects a task with a malformed projectId", async () => {
    const { token } = await registerUser();
    const res = await createTask(token, "not-a-uuid", { name: "X" });
    expect(res.status).toBe(422);
  });

  it("lists tasks for the authenticated user", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.body.data.id, { name: "T1" });
    await createTask(token, project.body.data.id, { name: "T2" });

    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("searches tasks by name", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.body.data.id, { name: "Write report" });
    await createTask(token, project.body.data.id, { name: "Fix bug" });

    const res = await request(app).get("/api/tasks?search=report").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("filters tasks by status and priority", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.body.data.id, { name: "Low", priority: "LOW", status: "PENDING" });
    await createTask(token, project.body.data.id, { name: "High", priority: "HIGH", status: "COMPLETED" });

    const byStatus = await request(app)
      .get("/api/tasks?status=COMPLETED")
      .set("Authorization", `Bearer ${token}`);
    expect(byStatus.body.data).toHaveLength(1);

    const byPriority = await request(app)
      .get("/api/tasks?priority=HIGH")
      .set("Authorization", `Bearer ${token}`);
    expect(byPriority.body.data).toHaveLength(1);
  });

  it("filters tasks by projectId", async () => {
    const { token } = await registerUser();
    const p1 = await createProject(token, { name: "P1" });
    const p2 = await createProject(token, { name: "P2" });
    await createTask(token, p1.body.data.id, { name: "In P1" });
    await createTask(token, p2.body.data.id, { name: "In P2" });

    const res = await request(app)
      .get(`/api/tasks?projectId=${p1.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("In P1");
  });

  it("updates a task's status (marks completed) and priority", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.body.data.id, { name: "Task" });

    const res = await request(app)
      .put(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "COMPLETED", priority: "HIGH" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("COMPLETED");
    expect(res.body.data.priority).toBe("HIGH");
  });

  it("deletes a task", async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.body.data.id, { name: "Task" });

    const del = await request(app)
      .delete(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it("prevents user B from viewing, editing, or deleting user A's task", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const project = await createProject(userA.token);
    const task = await createTask(userA.token, project.body.data.id, { name: "A's Task" });

    const view = await request(app)
      .get(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(view.status).toBe(404);

    const edit = await request(app)
      .put(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ name: "Hijacked" });
    expect(edit.status).toBe(404);

    const del = await request(app)
      .delete(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(del.status).toBe(404);

    const stillThere = await request(app)
      .get(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.data.name).toBe("A's Task");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});
