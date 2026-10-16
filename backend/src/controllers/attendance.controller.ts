import { Request, Response } from "express";
import {
  AttendanceRecord,
  Enrollment,
  ParentProfile,
  StudentProfile,
  TeacherProfile,
} from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";

export class AttendanceController {
  /** Mark attendance for a single student (teacher/admin). */
  markAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { studentId, classId, subjectId, date, status, academicTermId, remarks } =
      req.body;

    // Validate date is not in the future
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      throw new BadRequestError(MESSAGES.FUTURE_DATE_NOT_ALLOWED);
    }

    // RBAC: Teachers can only mark attendance for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(classId) || !tp.subjects.map(String).includes(subjectId)) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    const record = await AttendanceRecord.findOneAndUpdate(
      { studentId, classId, subjectId, date: attendanceDate },
      {
        studentId,
        classId,
        subjectId,
        date: attendanceDate,
        status,
        markedBy: req.user!._id,
        academicTermId,
        remarks,
      },
      { upsert: true, new: true, runValidators: true },
    );

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ATTENDANCE_MARKED",
      entity: "AttendanceRecord",
      entityId: record._id,
      metadata: { studentId, classId, date, status },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.ATTENDANCE_MARKED,
      data: record,
    });
  });

  /** Bulk mark attendance for a class (teacher/admin). */
  bulkMarkAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { classId, subjectId, date, academicTermId, records } = req.body;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      throw new BadRequestError(MESSAGES.FUTURE_DATE_NOT_ALLOWED);
    }

    // RBAC: Teachers can only mark attendance for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(classId) || !tp.subjects.map(String).includes(subjectId)) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    const bulkOps = records.map((r: any) => ({
      updateOne: {
        filter: { studentId: r.studentId, classId, subjectId, date: attendanceDate },
        update: {
          studentId: r.studentId,
          classId,
          subjectId,
          date: attendanceDate,
          status: r.status,
          markedBy: req.user!._id,
          academicTermId,
          remarks: r.remarks,
        },
        upsert: true,
      },
    }));

    await AttendanceRecord.bulkWrite(bulkOps);

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ATTENDANCE_BULK_MARKED",
      entity: "AttendanceRecord",
      metadata: { classId, date, count: records.length },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.ATTENDANCE_BULK_MARKED,
      data: { count: records.length },
    });
  });

  /** Get attendance for a class on optional date range. */
  getClassAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const classId = req.params.classId;

    // RBAC: Teachers can only view attendance for their assigned classes
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(classId)) {
        throw new ForbiddenError("You are not assigned to this class");
      }
    }

    const filter: any = { classId };
    if (req.query.date) filter.date = new Date(req.query.date as string);
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }
    if (req.query.status) filter.status = req.query.status;

    const [records, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .populate("studentId", "firstName lastName")
        .populate("markedBy", "firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AttendanceRecord.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Attendance"),
      data: records,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get attendance for a specific student. Respects ownership. */
  getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
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

    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = { studentId };
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    const [records, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .populate("classId", "name section")
        .populate("subjectId", "name code")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AttendanceRecord.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Attendance"),
      data: records,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get attendance summary for a class. */
  getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
    const classId = req.params.classId;
    const filter: any = { classId };
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    const summary = await AttendanceRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRecords = summary.reduce(
      (sum: number, s: any) => sum + s.count,
      0,
    );
    const formattedSummary = summary.reduce((acc: any, s: any) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Attendance Summary"),
      data: { ...formattedSummary, total: totalRecords },
    });
  });
}

export const attendanceController = new AttendanceController();
