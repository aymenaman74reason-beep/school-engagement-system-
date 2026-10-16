import { registerSchema, loginSchema } from "@validators/auth.validator";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate a correct registration object", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        role: "teacher",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        role: "teacher",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid email address");
      }
    });

    it("should fail on weak password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "123",
        firstName: "John",
        lastName: "Doe",
        role: "teacher",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e: any) => e.message);
        expect(messages).toContain("Password must be at least 8 characters");
      }
    });

    it("should fail on missing required fields", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123!",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail on invalid role", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        role: "superadmin",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate a correct login object", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail on missing password", () => {
      const invalidData = {
        email: "test@example.com",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
