import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createProject } from "./helpers";

describe("Projects", () => {
  it("creates a project for the authenticated user", async () => {
    const { token } = await registerUser();
    const res = await createProject(token, { name: "Alpha", status: "IN_PROGRESS" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Alpha");
    expect(res.body.data.status).toBe("IN_PROGRESS");
  });

  it("rejects a project with a blank name", async () => {
    const { token } = await registerUser();
    const res = await createProject(token, { name: "   " });
    expect(res.status).toBe(422);
  });

  it("rejects a project with an invalid status enum", async () => {
    const { token } = await registerUser();
    const res = await createProject(token, { name: "X", status: "WRONG" });
    expect(res.status).toBe(422);
  });

  it("rejects a project where endDate is before startDate", async () => {
    const { token } = await registerUser();
    const res = await createProject(token, {
      name: "X",
      startDate: "2026-05-01",
      endDate: "2026-01-01",
    });
    expect(res.status).toBe(422);
  });

  it("lists only the authenticated user's own projects", async () => {
    const { token } = await registerUser();
    await createProject(token, { name: "Mine 1" });
    await createProject(token, { name: "Mine 2" });

    const res = await request(app).get("/api/projects").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("searches projects by name", async () => {
    const { token } = await registerUser();
    await createProject(token, { name: "Website Redesign" });
    await createProject(token, { name: "Mobile Launch" });

    const res = await request(app)
      .get("/api/projects?search=website")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Website Redesign");
  });

  it("filters projects by status", async () => {
    const { token } = await registerUser();
    await createProject(token, { name: "A", status: "COMPLETED" });
    await createProject(token, { name: "B", status: "NOT_STARTED" });

    const res = await request(app)
      .get("/api/projects?status=COMPLETED")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("COMPLETED");
  });

  it("gets a single project by id", async () => {
    const { token } = await registerUser();
    const created = await createProject(token, { name: "Detail" });

    const res = await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it("updates a project", async () => {
    const { token } = await registerUser();
    const created = await createProject(token, { name: "Old Name" });

    const res = await request(app)
      .put(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name", status: "COMPLETED" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(res.body.data.status).toBe("COMPLETED");
  });

  it("deletes a project", async () => {
    const { token } = await registerUser();
    const created = await createProject(token, { name: "ToDelete" });

    const del = await request(app)
      .delete(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(401);
  });

  it("prevents user B from accessing user A's project", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const created = await createProject(userA.token, { name: "A's Project" });

    const res = await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  it("prevents user B from updating user A's project", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const created = await createProject(userA.token, { name: "A's Project" });

    const res = await request(app)
      .put(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ name: "Hijacked" });
    expect(res.status).toBe(404);

    const check = await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(check.body.data.name).toBe("A's Project");
  });

  it("prevents user B from deleting user A's project", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const created = await createProject(userA.token, { name: "A's Project" });

    const res = await request(app)
      .delete(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(404);

    const check = await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(check.status).toBe(200);
  });
});
