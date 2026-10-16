import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ROLE_PERMISSIONS } from "../constants/permissions";
import { UnauthorizedError } from "../utils/errors";
import { MESSAGES } from "../constants/messages";
import { IAuthUser } from "../types";

/**
 * Middleware to authenticate requests via JWT Bearer token.
 * Attaches user info to req.user.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(MESSAGES.TOKEN_REQUIRED);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      throw new UnauthorizedError(MESSAGES.TOKEN_INVALID);
    }

    if (!user.isActive || user.status !== "active") {
      throw new UnauthorizedError(MESSAGES.ACCOUNT_INACTIVE);
    }

    if (user.isLocked) {
      throw new UnauthorizedError(MESSAGES.ACCOUNT_LOCKED);
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const changedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (decoded.iat < changedTimestamp) {
        throw new UnauthorizedError(MESSAGES.TOKEN_INVALID);
      }
    }

    const permissions = ROLE_PERMISSIONS[user.role] || [];

    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
      permissions: permissions.map(String),
    } as IAuthUser;

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return next(new UnauthorizedError(MESSAGES.TOKEN_INVALID));
    }
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError(MESSAGES.TOKEN_EXPIRED));
    }
    next(error);
  }
};
