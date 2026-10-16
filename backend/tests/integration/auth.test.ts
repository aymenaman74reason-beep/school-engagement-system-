import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/models/User";
import { setupTestDB, createTestUser } from "../helpers/setup";

setupTestDB();

describe("Auth API", () => {
  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      // Create user directly (password will be hashed by pre-save hook)
      await User.create({
        email: "login@school.com",
        password: "Test@123456",
        firstName: "Login",
        lastName: "User",
        role: "admin",
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@school.com", password: "Test@123456" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe("login@school.com");
    });

    it("should reject invalid credentials", async () => {
      await User.create({
        email: "reject@school.com",
        password: "Test@123456",
        firstName: "Test",
        lastName: "User",
        role: "admin",
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "reject@school.com", password: "WrongPassword1!" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject login with missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@school.com" });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user (admin only)", async () => {
      const { token } = await createTestUser({ role: "admin" });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "newuser@school.com",
          password: "NewUser@123456",
          firstName: "New",
          lastName: "User",
          role: "student",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("newuser@school.com");
      expect(res.body.data.role).toBe("student");
    });

    it("should reject registration by non-admin", async () => {
      const { token } = await createTestUser({ role: "student" });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "illegal@school.com",
          password: "Illegal@123456",
          firstName: "Illegal",
          lastName: "User",
          role: "student",
        });

      expect(res.status).toBe(403);
    });

    it("should reject duplicate email registration", async () => {
      const { token } = await createTestUser({
        role: "admin",
        email: "admindup@school.com",
      });

      await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "dup@school.com",
          password: "DupUser@123456",
          firstName: "Dup",
          lastName: "User",
          role: "teacher",
        });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "dup@school.com",
          password: "DupUser@123456",
          firstName: "Dup2",
          lastName: "User2",
          role: "teacher",
        });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user profile", async () => {
      const { token } = await createTestUser({
        email: "me@school.com",
        role: "admin",
      });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("me@school.com");
    });

    it("should reject unauthenticated access", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/v1/auth/change-password", () => {
    it("should change password for authenticated user", async () => {
      // Create user
      await User.create({
        email: "changepw@school.com",
        password: "OldPassword@123",
        firstName: "Change",
        lastName: "PW",
        role: "teacher",
      });

      // Login first
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "changepw@school.com", password: "OldPassword@123" });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "OldPassword@123",
          newPassword: "NewPassword@123",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Password changed");
    });
  });
});

describe("RBAC", () => {
  it("should deny student access to admin endpoints", async () => {
    const { token } = await createTestUser({
      role: "student",
      email: "studenrbac@school.com",
    });

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("should deny parent access to admin endpoints", async () => {
    const { token } = await createTestUser({
      role: "parent",
      email: "parentrbac@school.com",
    });

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("should allow admin access to admin endpoints", async () => {
    const { token } = await createTestUser({
      role: "admin",
      email: "adminrbac@school.com",
    });

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe("Health Check", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
