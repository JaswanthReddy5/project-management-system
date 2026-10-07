import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { app, registerUser, createProject } from "./helpers";
import { createAuthRateLimiter } from "../src/middleware/rateLimit";

describe("Security", () => {
  it("never returns passwordHash in register/login/me responses", async () => {
    const { res: registerRes, token } = await registerUser({ email: "safe@example.com" });
    expect(JSON.stringify(registerRes.body)).not.toContain("passwordHash");

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "safe@example.com", password: "Password123!" });
    expect(JSON.stringify(loginRes.body)).not.toContain("passwordHash");

    const meRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(JSON.stringify(meRes.body)).not.toContain("passwordHash");
  });

  it("treats SQL-injection-style strings as safe literal data (parameterized queries)", async () => {
    const { token } = await registerUser();
    const maliciousName = "Robert'); DROP TABLE \"Project\"; --";

    const created = await createProject(token, { name: maliciousName });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe(maliciousName);

    // The Project table must still be queryable (i.e. not dropped).
    const list = await request(app).get("/api/projects").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((p: { name: string }) => p.name === maliciousName)).toBe(true);
  });

  it("is not vulnerable to SQL injection via login email field", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "' OR '1'='1", password: "anything" });
    // Fails zod email validation -> 422, never reaches the database as raw SQL
    expect(res.status).toBe(422);
  });

  it("enforces rate limiting on repeated auth attempts", async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post("/test-login", createAuthRateLimiter(3), (_req, res) => res.status(200).json({ ok: true }));

    for (let i = 0; i < 3; i++) {
      const res = await request(testApp).post("/test-login").send({});
      expect(res.status).toBe(200);
    }

    const blocked = await request(testApp).post("/test-login").send({});
    expect(blocked.status).toBe(429);
  });

  it("returns malformed-id requests as validation errors, not server errors", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .get("/api/projects/'; DROP TABLE \"User\"; --")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});
