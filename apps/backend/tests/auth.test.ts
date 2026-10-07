import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser } from "./helpers";

describe("Auth", () => {
  it("registers a new user and returns a token without the password hash", async () => {
    const { res } = await registerUser({ email: "newuser@example.com" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("newuser@example.com");
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects duplicate email registration with 409", async () => {
    await registerUser({ email: "dup@example.com" });
    const { res } = await registerUser({ email: "dup@example.com" });
    expect(res.status).toBe(409);
  });

  it("rejects registration with invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "X", email: "not-an-email", password: "Password123!" });
    expect(res.status).toBe(422);
  });

  it("rejects registration with short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "X", email: "shortpw@example.com", password: "123" });
    expect(res.status).toBe(422);
  });

  it("logs in with correct credentials", async () => {
    await registerUser({ email: "login@example.com", password: "Password123!" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects login with wrong password", async () => {
    await registerUser({ email: "wrongpw@example.com", password: "Password123!" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrongpw@example.com", password: "WrongPassword!" });
    expect(res.status).toBe(401);
  });

  it("rejects login for nonexistent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@example.com", password: "Password123!" });
    expect(res.status).toBe(401);
  });

  it("returns the current user from /me with a valid token", async () => {
    const { token, user } = await registerUser({ email: "me@example.com" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects /me with an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.valid.token");
    expect(res.status).toBe(401);
  });

  it("logs out successfully with a valid token", async () => {
    const { token } = await registerUser({ email: "logout@example.com" });
    const res = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
