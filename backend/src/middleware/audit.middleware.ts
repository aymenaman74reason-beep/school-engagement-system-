import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog";
import { logger } from "../utils/logger";

/**
 * Create an audit log entry. Used as a utility within services/controllers.
 */
export const createAuditLog = async (data: {
  actor: any;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await AuditLog.create(data);
  } catch (error) {
    logger.error("Failed to create audit log:", error);
  }
};

/**
 * Middleware that logs actions automatically for mutation endpoints.
 */
export const auditMiddleware = (action: string, entity: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Store audit info on the request for post-response logging
    (req as any).__audit = {
      action,
      entity,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
    };
    next();
  };
};
