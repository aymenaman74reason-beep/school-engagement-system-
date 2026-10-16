import { Request, Response } from "express";
import { GradeRecord, ParentProfile, TeacherProfile } from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";

export class GradeController {
  /** Enter a new grade (teacher/admin). */
  createGrade = asyncHandler(async (req: Request, res: Response) => {
    const { studentId, subjectId, classId, academicTermId, scores, remarks, performanceLevel } = req.body;
    
    // RBAC: Teachers can only enter grades for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(classId) || !tp.subjects.map(String).includes(subjectId)) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    // Find existing record or create new one
    let grade = await GradeRecord.findOne({ studentId, subjectId, classId, academicTermId });
    
    if (grade) {
      // Merge scores: if same name exists, update it, otherwise push
      const newScores = [...grade.scores];
      scores.forEach((s: any) => {
        const idx = newScores.findIndex(ns => ns.name.toLowerCase() === s.name.toLowerCase());
        if (idx !== -1) newScores[idx] = s;
        else newScores.push(s);
      });
      grade.scores = newScores;
      if (remarks) grade.remarks = remarks;
      if (performanceLevel) grade.performanceLevel = performanceLevel;
      await grade.save();
    } else {
      grade = await GradeRecord.create({
        ...req.body,
        isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
        enteredBy: req.user!._id
      });
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "GRADE_ENTERED",
      entity: "GradeRecord",
      entityId: grade._id,
      metadata: { studentId, subjectId, academicTermId },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.GRADE_ENTERED,
      data: grade,
    });
  });

  /** Update an existing grade (teacher/admin). */
  updateGrade = asyncHandler(async (req: Request, res: Response) => {
    const grade = await GradeRecord.findById(req.params.id);
    if (!grade) throw new NotFoundError(MESSAGES.NOT_FOUND("Grade"));

    // RBAC: Teachers can only update grades for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(grade.classId.toString()) || !tp.subjects.map(String).includes(grade.subjectId.toString())) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    Object.assign(grade, req.body);
    await grade.save();

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "GRADE_UPDATED",
      entity: "GradeRecord",
      entityId: grade._id,
      metadata: req.body,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, { message: MESSAGES.GRADE_UPDATED, data: grade });
  });

  /** Get grades for a specific student. Respects ownership. */
  getStudentGrades = asyncHandler(async (req: Request, res: Response) => {
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
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;
    if (req.query.classId) filter.classId = req.query.classId;

    // Students and parents can only see published grades
    if (user.role === "student" || user.role === "parent") {
      filter.isPublished = true;
    }

    const [grades, total] = await Promise.all([
      GradeRecord.find(filter)
        .populate("subjectId", "name code")
        .populate("classId", "name section")
        .populate("academicTermId", "name year")
        .populate("enteredBy", "firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      GradeRecord.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Grades"),
      data: grades,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get grades for a class/subject (teacher/admin). */
  getClassSubjectGrades = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const classId = req.params.classId;
    const subjectId = req.params.subjectId;

    // RBAC: Teachers can only view grades for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(classId) || !tp.subjects.map(String).includes(subjectId)) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    const filter: any = { classId, subjectId };
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;

    const [grades, total] = await Promise.all([
      GradeRecord.find(filter)
        .populate("studentId", "firstName lastName")
        .populate("subjectId", "name code")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      GradeRecord.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Grades"),
      data: grades,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get grade summary for a class using aggregation. */
  getGradeSummary = asyncHandler(async (req: Request, res: Response) => {
    const filter: any = { classId: req.params.classId };
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;

    const summary = await GradeRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$subjectId",
          avgPercentage: { $avg: "$percentage" },
          maxPercentage: { $max: "$percentage" },
          minPercentage: { $min: "$percentage" },
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
          subjectCode: "$subject.code",
          avgPercentage: { $round: ["$avgPercentage", 2] },
          maxPercentage: 1,
          minPercentage: 1,
          totalStudents: 1,
        },
      },
    ]);

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Grade Summary"),
      data: summary,
    });
  });
}

export const gradeController = new GradeController();
