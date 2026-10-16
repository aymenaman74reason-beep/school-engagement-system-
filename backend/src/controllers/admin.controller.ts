import { Request, Response } from "express";
import { AuditLog, SchoolConfig } from "../models";
import {
  asyncHandler,
  ApiResponse,
  parsePaginationQuery,
  parseSearchQuery,
} from "../utils";
import { NotFoundError } from "../utils/errors";
import { MESSAGES } from "../constants";

export class AuditLogController {
  /** Get audit logs with pagination and filtering (admin only). */
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};

    if (req.query.action) filter.action = req.query.action;
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.actorId) filter.actor = req.query.actorId;
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "firstName lastName email role")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Audit Logs"),
      data: logs,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single audit log entry. */
  getLog = asyncHandler(async (req: Request, res: Response) => {
    const log = await AuditLog.findById(req.params.id).populate(
      "actor",
      "firstName lastName email role",
    );
    if (!log) throw new NotFoundError(MESSAGES.NOT_FOUND("Audit Log"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Audit Log"),
      data: log,
    });
  });
}

export class SchoolConfigController {
  /** Get school configuration. */
  getConfig = asyncHandler(async (req: Request, res: Response) => {
    let config = await SchoolConfig.findOne();
    if (!config) {
      config = await SchoolConfig.create({
        name: "School Management System",
        address: "Address not set",
      });
    }
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("School Config"),
      data: config,
    });
  });

  /** Update school configuration. */
  updateConfig = asyncHandler(async (req: Request, res: Response) => {
    let config = await SchoolConfig.findOne();
    if (!config) {
      config = await SchoolConfig.create({
        ...req.body,
        name: req.body.name || "School",
        address: req.body.address || "N/A",
      });
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("School Config"),
      data: config,
    });
  });
}

export const auditLogController = new AuditLogController();
export const schoolConfigController = new SchoolConfigController();
