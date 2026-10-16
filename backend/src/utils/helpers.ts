import { Request } from "express";

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

/**
 * Parse pagination, sort params from request query.
 */
export const parsePaginationQuery = (req: Request): PaginationQuery => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 20),
  );
  const skip = (page - 1) * limit;

  const sortField = (req.query.sortBy as string) || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  return { page, limit, skip, sort };
};

/**
 * Parse search query from request.
 */
export const parseSearchQuery = (
  req: Request,
  fields: string[],
): Record<string, any> => {
  const search = req.query.search as string;
  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })),
  };
};

/**
 * Generate a random token string.
 */
export const generateToken = (length = 64): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const crypto = require("crypto");
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

/**
 * Generate a secure password that meets validation rules:
 * - At least one lowercase, one uppercase, one digit, one special char
 */
export const generatePassword = (length = 12): string => {
  const crypto = require("crypto");
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%&*?";
  const all = lower + upper + digits + special;

  let password = "";
  // Guarantee one of each required type
  const bytes = crypto.randomBytes(length + 4);
  password += lower[bytes[0] % lower.length];
  password += upper[bytes[1] % upper.length];
  password += digits[bytes[2] % digits.length];
  password += special[bytes[3] % special.length];

  for (let i = 4; i < length; i++) {
    password += all[bytes[i] % all.length];
  }

  // Shuffle the password
  const arr = password.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = bytes[(i + 4) % bytes.length] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
};
