import { Request, Response } from "express";
import {
  Report,
  AttendanceRecord,
  GradeRecord,
  User,
  Enrollment,
} from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";
import mongoose from "mongoose";

export class ReportController {
  /** Generate a report. */
  generateReport = asyncHandler(async (req: Request, res: Response) => {
    const { type, title, parameters = {}, format = "json" } = req.body;
    const report = await Report.create({
      type,
      title,
      generatedBy: req.user!._id,
      parameters,
      format,
      status: "generating",
    });

    // Generate report data based on type
    let reportData: any = {};
    try {
      switch (type) {
        case "attendance":
          reportData = await this.generateAttendanceReport(parameters);
          break;
        case "grade":
          reportData = await this.generateGradeReport(parameters);
          break;
        case "student_performance":
          reportData = await this.generateStudentPerformanceReport(parameters);
          break;
        case "class_performance":
          reportData = await this.generateClassPerformanceReport(parameters);
          break;
        case "user_summary":
          reportData = await this.generateUserSummaryReport();
          break;
        default:
          reportData = {
            message: "Custom report type — no auto-generation available",
          };
      }

      report.data = reportData;
      report.status = "completed";
      await report.save();
    } catch (error) {
      report.status = "failed";
      report.data = { error: (error as Error).message };
      await report.save();
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "REPORT_GENERATED",
      entity: "Report",
      entityId: report._id,
      metadata: { type, parameters },
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.REPORT_GENERATED,
      data: report,
    });
  });

  /** Get all reports. */
  getReports = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    // Teachers can only see their own reports
    if (req.user!.role === "teacher") {
      filter.generatedBy = req.user!._id;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("generatedBy", "firstName lastName")
        .select("-data")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Reports"),
      data: reports,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single report. */
  getReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await Report.findById(req.params.id).populate(
      "generatedBy",
      "firstName lastName",
    );
    if (!report) throw new NotFoundError(MESSAGES.NOT_FOUND("Report"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Report"),
      data: report,
    });
  });

  // ===== Report generation methods =====

  private async generateAttendanceReport(params: any) {
    const match: any = {};
    if (params.classId)
      match.classId = new mongoose.Types.ObjectId(params.classId);
    if (params.startDate && params.endDate) {
      match.date = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    }
    if (params.academicTermId)
      match.academicTermId = new mongoose.Types.ObjectId(params.academicTermId);

    const summary = await AttendanceRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { studentId: "$studentId", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.studentId",
          attendance: { $push: { status: "$_id.status", count: "$count" } },
          totalDays: { $sum: "$count" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          studentName: {
            $concat: ["$student.firstName", " ", "$student.lastName"],
          },
          attendance: 1,
          totalDays: 1,
        },
      },
      { $sort: { studentName: 1 } },
    ]);

    return {
      type: "attendance",
      generatedAt: new Date(),
      records: summary,
      totalStudents: summary.length,
    };
  }

  private async generateGradeReport(params: any) {
    const match: any = {};
    if (params.classId)
      match.classId = new mongoose.Types.ObjectId(params.classId);
    if (params.subjectId)
      match.subjectId = new mongoose.Types.ObjectId(params.subjectId);
    if (params.academicTermId)
      match.academicTermId = new mongoose.Types.ObjectId(params.academicTermId);

    const summary = await GradeRecord.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $project: {
          studentName: {
            $concat: ["$student.firstName", " ", "$student.lastName"],
          },
          subjectName: "$subject.name",
          totalScore: 1,
          maxTotalScore: 1,
          percentage: 1,
          grade: 1,
        },
      },
      { $sort: { studentName: 1 } },
    ]);

    return {
      type: "grade",
      generatedAt: new Date(),
      records: summary,
      totalRecords: summary.length,
    };
  }

  private async generateStudentPerformanceReport(params: any) {
    if (!params.studentId) return { error: "studentId parameter required" };
    const studentId = new mongoose.Types.ObjectId(params.studentId);

    const [grades, attendance] = await Promise.all([
      GradeRecord.aggregate([
        { $match: { studentId } },
        {
          $lookup: {
            from: "subjects",
            localField: "subjectId",
            foreignField: "_id",
            as: "subject",
          },
        },
        { $unwind: "$subject" },
        {
          $project: {
            subjectName: "$subject.name",
            percentage: 1,
            grade: 1,
            totalScore: 1,
            maxTotalScore: 1,
          },
        },
      ]),
      AttendanceRecord.aggregate([
        { $match: { studentId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const attendanceSummary = attendance.reduce((acc: any, a: any) => {
      acc[a._id] = a.count;
      return acc;
    }, {});
    const avgPercentage =
      grades.length > 0
        ? grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) /
          grades.length
        : 0;

    return {
      type: "student_performance",
      generatedAt: new Date(),
      grades,
      attendanceSummary,
      avgPercentage: Math.round(avgPercentage * 100) / 100,
    };
  }

  private async generateClassPerformanceReport(params: any) {
    if (!params.classId) return { error: "classId parameter required" };

    const summary = await GradeRecord.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(params.classId) } },
      {
        $group: {
          _id: "$subjectId",
          avgPercentage: { $avg: "$percentage" },
          maxPercentage: { $max: "$percentage" },
          minPercentage: { $min: "$percentage" },
          passCount: { $sum: { $cond: [{ $gte: ["$percentage", 50] }, 1, 0] } },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $project: {
          subjectName: "$subject.name",
          avgPercentage: { $round: ["$avgPercentage", 2] },
          maxPercentage: 1,
          minPercentage: 1,
          passRate: {
            $round: [
              {
                $multiply: [{ $divide: ["$passCount", "$totalStudents"] }, 100],
              },
              2,
            ],
          },
          totalStudents: 1,
        },
      },
    ]);

    return {
      type: "class_performance",
      generatedAt: new Date(),
      subjects: summary,
    };
  }

  private async generateUserSummaryReport() {
    const summary = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ["$isActive", 1, 0] } },
        },
      },
    ]);
    const total = summary.reduce((sum: number, s: any) => sum + s.count, 0);
    return {
      type: "user_summary",
      generatedAt: new Date(),
      byRole: summary,
      totalUsers: total,
    };
  }
}

export const reportController = new ReportController();
