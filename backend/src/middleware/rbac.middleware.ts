import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/errors";
import { MESSAGES } from "../constants/messages";

/**
 * Middleware to check if user has the required role(s).
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError(MESSAGES.UNAUTHORIZED));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(MESSAGES.INSUFFICIENT_PERMISSIONS));
    }
    next();
  };
};

/**
 * Middleware to check if user has the required permission(s).
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError(MESSAGES.UNAUTHORIZED));
    }
    const hasPermission = permissions.every((perm) =>
      req.user!.permissions.includes(perm),
    );
    if (!hasPermission) {
      return next(new ForbiddenError(MESSAGES.INSUFFICIENT_PERMISSIONS));
    }
    next();
  };
};

/**
 * Middleware to check if user is an admin or has one of the allowed roles.
 */
export const requireRoleOrAdmin = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError(MESSAGES.UNAUTHORIZED));
    }
    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      return next();
    }
    return next(new ForbiddenError(MESSAGES.INSUFFICIENT_PERMISSIONS));
  };
};
