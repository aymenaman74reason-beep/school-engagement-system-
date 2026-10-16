import { Request } from "express";
import {
  parsePaginationQuery,
  parseSearchQuery,
  generateToken,
  generatePassword,
} from "@utils";

describe("Helpers Utility", () => {
  describe("parsePaginationQuery", () => {
    it("should parse default pagination values", () => {
      const req = { query: {} } as unknown as Request;
      const result = parsePaginationQuery(req);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
        sort: { createdAt: -1 },
      });
    });

    it("should parse custom pagination values", () => {
      const req = {
        query: { page: "2", limit: "10", sortBy: "name", sortOrder: "asc" },
      } as unknown as Request;
      const result = parsePaginationQuery(req);
      expect(result).toEqual({
        page: 2,
        limit: 10,
        skip: 10,
        sort: { name: 1 },
      });
    });

    it("should enforce minimum page and limit", () => {
      const req = {
        query: { page: "0", limit: "-5" },
      } as unknown as Request;
      const result = parsePaginationQuery(req);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it("should enforce maximum limit", () => {
      const req = {
        query: { limit: "200" },
      } as unknown as Request;
      const result = parsePaginationQuery(req);
      expect(result.limit).toBe(100);
    });
  });

  describe("parseSearchQuery", () => {
    it("should return empty object if no search term", () => {
      const req = { query: {} } as unknown as Request;
      const result = parseSearchQuery(req, ["name", "email"]);
      expect(result).toEqual({});
    });

    it("should return $or query with regex", () => {
      const req = { query: { search: "test" } } as unknown as Request;
      const fields = ["name", "email"];
      const result = parseSearchQuery(req, fields);
      expect(result).toEqual({
        $or: [
          { name: { $regex: "test", $options: "i" } },
          { email: { $regex: "test", $options: "i" } },
        ],
      });
    });
  });

  describe("generateToken", () => {
    it("should generate a token of default length", () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
    });

    it("should generate a token of specified length", () => {
      const token = generateToken(32);
      expect(token).toHaveLength(32);
    });

    it("should generate unique tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("generatePassword", () => {
    it("should generate a password of default length", () => {
      const password = generatePassword();
      expect(password).toHaveLength(12);
    });

    it("should generate a password that meets security requirements", () => {
      const password = generatePassword(16);
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[!@#$%&*?]/);
    });
  });
});
