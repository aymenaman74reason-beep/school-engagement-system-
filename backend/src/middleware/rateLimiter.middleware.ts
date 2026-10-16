import rateLimit from "express-rate-limit";
import { MESSAGES } from "../constants/messages";

/**
 * General API rate limiter.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: MESSAGES.RATE_LIMIT_EXCEEDED },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints (login, password reset).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: MESSAGES.RATE_LIMIT_EXCEEDED },
  standardHeaders: true,
  legacyHeaders: false,
});
