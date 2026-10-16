import { Request, Response } from "express";
import { DismissalCase, StudentProfile, ParentProfile } from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";

export class DismissalController {
  /** Create a new dismissal case (teacher/admin). */
  createCase = asyncHandler(async (req: Request, res: Response) => {
    const {
      studentId,
      type,
      reason,
      description,
      academicTermId,
    } = req.body;

    if (!studentId || !type || !reason) {
      throw new BadRequestError("studentId, type, and reason are required");
    }

    const dismissalCase = await DismissalCase.create({
      studentId,
      type,
      reason,
      description,
      academicTermId,
      initiatedBy: req.user!._id,
      status: "pending",
      reviewHistory: [
        {
          reviewer: req.user!._id,
          action: "comment",
          comment: `Case initiated: ${reason}`,
          date: new Date(),
        },
      ],
    });

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "DISMISSAL_CASE_CREATED",
      entity: "DismissalCase",
      entityId: dismissalCase._id,
      metadata: { studentId, type, reason },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.DISMISSAL_CASE_CREATED,
      data: dismissalCase,
    });
  });

  /** Get all dismissal cases (admin/teacher). */
  getCases = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    // Students and parents can only see their own/children's cases
    if (req.user!.role === "student") {
      filter.studentId = req.user!._id;
    }
    if (req.user!.role === "parent") {
      const parentProfile = await ParentProfile.findOne({
        userId: req.user!._id,
      });
      if (parentProfile) {
        filter.studentId = { $in: parentProfile.childrenIds };
      } else {
        filter.studentId = { $in: [] };
      }
    }

    const [cases, total] = await Promise.all([
      DismissalCase.find(filter)
        .populate("studentId", "firstName lastName email")
        .populate("initiatedBy", "firstName lastName")
        .populate("reviewedBy", "firstName lastName")
        .populate("academicTermId", "name year")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      DismissalCase.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Dismissal Cases"),
      data: cases,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single dismissal case. */
  getCase = asyncHandler(async (req: Request, res: Response) => {
    const dismissalCase = await DismissalCase.findById(req.params.id)
      .populate("studentId", "firstName lastName email")
      .populate("initiatedBy", "firstName lastName")
      .populate("reviewedBy", "firstName lastName")
      .populate("reviewHistory.reviewer", "firstName lastName")
      .populate("academicTermId", "name year");

    if (!dismissalCase)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Dismissal Case"));

    // Ownership check for student/parent
    if (req.user!.role === "student") {
      if (dismissalCase.studentId.toString() !== req.user!._id.toString()) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
    }
    if (req.user!.role === "parent") {
      const parentProfile = await ParentProfile.findOne({
        userId: req.user!._id,
      });
      if (
        !parentProfile ||
        !parentProfile.childrenIds
          .map(String)
          .includes(dismissalCase.studentId.toString())
      ) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
    }

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Dismissal Case"),
      data: dismissalCase,
    });
  });

  /** Add a review entry to a case (admin/teacher). */
  addReview = asyncHandler(async (req: Request, res: Response) => {
    const { action, comment } = req.body;
    if (
      !action ||
      !["reviewed", "approved", "rejected", "appealed", "comment"].includes(
        action,
      )
    ) {
      throw new BadRequestError("Valid action is required");
    }

    const dismissalCase = await DismissalCase.findById(req.params.id);
    if (!dismissalCase)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Dismissal Case"));

    dismissalCase.reviewHistory.push({
      reviewer: req.user!._id,
      action,
      comment,
      date: new Date(),
    });

    // Update status based on action
    if (action === "reviewed") dismissalCase.status = "under_review";
    if (action === "appealed") dismissalCase.status = "appealed";

    dismissalCase.reviewedBy = req.user!._id;
    await dismissalCase.save();

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "DISMISSAL_CASE_REVIEWED",
      entity: "DismissalCase",
      entityId: dismissalCase._id,
      metadata: { reviewAction: action },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.DISMISSAL_CASE_REVIEWED,
      data: dismissalCase,
    });
  });

  /** Resolve a dismissal case (admin). */
  resolveCase = asyncHandler(async (req: Request, res: Response) => {
    const { action, outcome, effectiveDate } = req.body;
    if (!action || !["approved", "rejected"].includes(action)) {
      throw new BadRequestError("Action must be 'approved' or 'rejected'");
    }

    const dismissalCase = await DismissalCase.findById(req.params.id);
    if (!dismissalCase)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Dismissal Case"));

    dismissalCase.status = action;
    dismissalCase.outcome = outcome;
    dismissalCase.effectiveDate = effectiveDate
      ? new Date(effectiveDate)
      : new Date();
    dismissalCase.reviewedBy = req.user!._id;
    dismissalCase.reviewHistory.push({
      reviewer: req.user!._id,
      action,
      comment: outcome,
      date: new Date(),
    });

    await dismissalCase.save();

    // If approved, update student academic status
    if (action === "approved") {
      await StudentProfile.findOneAndUpdate(
        { userId: dismissalCase.studentId },
        { academicStatus: "dismissed" },
      );
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "DISMISSAL_CASE_RESOLVED",
      entity: "DismissalCase",
      entityId: dismissalCase._id,
      metadata: { resolution: action, outcome },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.DISMISSAL_CASE_RESOLVED,
      data: dismissalCase,
    });
  });
}

export const dismissalController = new DismissalController();
