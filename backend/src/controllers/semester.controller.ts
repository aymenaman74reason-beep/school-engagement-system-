import { Request, Response } from "express";
import {
  SemesterRecord,
  GradeRecord,
  Enrollment,
  StudentProfile,
  ParentProfile,
} from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";
import {
  progressStudents,
  getStudentSemesterHistory,
  computeSemesterGPA,
  computeClassRanking,
} from "../services/semester.service";

export class SemesterController {
  /** Progress students from one term to the next (admin). */
  progressStudents = asyncHandler(async (req: Request, res: Response) => {
    const { fromTermId, toTermId, classId, promotedToClassId } = req.body;

    if (!fromTermId || !toTermId || !classId) {
      throw new BadRequestError(
        "fromTermId, toTermId, and classId are required",
      );
    }

    const result = await progressStudents(
      fromTermId,
      toTermId,
      classId,
      promotedToClassId,
    );

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "SEMESTER_PROGRESSION",
      entity: "SemesterRecord",
      metadata: { fromTermId, toTermId, classId, ...result },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.SEMESTER_PROGRESSED,
      data: result,
    });
  });

  /** Get semester history for a student. Respects ownership. */
  getStudentHistory = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.params.studentId;
    const user = req.user!;

    // Ownership checks
    if (user.role === "student" && user._id.toString() !== studentId) {
      throw new ForbiddenError(MESSAGES.FORBIDDEN);
    }
    if (user.role === "parent") {
      const parentProfile = await ParentProfile.findOne({ userId: user._id });
      if (
        !parentProfile ||
        !parentProfile.childrenIds.map(String).includes(studentId)
      ) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
    }

    const history = await getStudentSemesterHistory(studentId);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Semester History"),
      data: history,
    });
  });

  /** Get current semester status for a student. */
  getCurrentStatus = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.params.studentId;
    const user = req.user!;

    // Ownership checks
    if (user.role === "student" && user._id.toString() !== studentId) {
      throw new ForbiddenError(MESSAGES.FORBIDDEN);
    }
    if (user.role === "parent") {
      const parentProfile = await ParentProfile.findOne({ userId: user._id });
      if (
        !parentProfile ||
        !parentProfile.childrenIds.map(String).includes(studentId)
      ) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
    }

    // Find latest semester record
    const latest = await SemesterRecord.findOne({ studentId })
      .sort({ createdAt: -1 })
      .populate("academicTermId", "name year type")
      .populate("classId", "name section");

    // Also get current enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      status: "active",
    })
      .populate("classId", "name section")
      .populate("academicTermId", "name year type");

    const profile = await StudentProfile.findOne({ userId: studentId });

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Current Status"),
      data: {
        semesterRecord: latest,
        currentEnrollment: enrollment,
        academicStatus: profile?.academicStatus || "active",
      },
    });
  });

  /** Compute and return class rankings. */
  getClassRanking = asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { academicTermId } = req.query;

    if (!academicTermId) {
      throw new BadRequestError("academicTermId query parameter is required");
    }

    const rankings = await computeClassRanking(
      classId,
      academicTermId as string,
    );

    // Populate student names
    const populatedRankings = await Promise.all(
      rankings.map(async (r) => {
        const user = await (await import("../models")).User.findById(
          r.studentId,
          "firstName lastName",
        );
        return {
          ...r,
          studentName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        };
      }),
    );

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Rankings"),
      data: populatedRankings,
    });
  });

  /** Get semester records for a class in a term (teacher/admin). */
  getClassSemesterRecords = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, skip, sort } = parsePaginationQuery(req);
      const filter: any = {};
      if (req.query.classId) filter.classId = req.query.classId;
      if (req.query.academicTermId)
        filter.academicTermId = req.query.academicTermId;
      if (req.query.status) filter.status = req.query.status;

      const [records, total] = await Promise.all([
        SemesterRecord.find(filter)
          .populate("studentId", "firstName lastName email")
          .populate("academicTermId", "name year")
          .populate("classId", "name section")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        SemesterRecord.countDocuments(filter),
      ]);

      ApiResponse.success(res, {
        message: MESSAGES.FETCHED("Semester Records"),
        data: records,
        pagination: ApiResponse.buildPagination(page, limit, total),
      });
    },
  );
}

export const semesterController = new SemesterController();
