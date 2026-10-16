import { Request, Response } from "express";
import {
  AcademicTerm,
  Assignment,
  AssignmentSubmission,
  Feedback,
  ParentProfile,
  Enrollment,
  TeacherProfile,
  StudentProfile,
} from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";
import { uploadToCloudinary } from "../middleware/upload.middleware";

export class AssignmentController {
  /** Create a new assignment (teacher/admin). */
  createAssignment = asyncHandler(async (req: Request, res: Response) => {
    let { totalPoints, totalMarks, academicTermId, ...rest } = req.body;
    
    // Map totalPoints to totalMarks if provided
    const marks = totalMarks || Number(totalPoints);
    if (!marks || isNaN(marks)) {
      throw new BadRequestError("Total marks is required and must be a number");
    }

    // Handle file upload if present
    const attachments: string[] = [];
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "assignments/prompts",
        req.file.mimetype
      );
      attachments.push(result.secure_url);
    }

    // Ensure academicTermId is present
    if (!academicTermId) {
      const currentTerm = await AcademicTerm.findOne({ isCurrent: true });
      if (!currentTerm) {
        throw new BadRequestError("No current academic term found. Please specify academicTermId.");
      }
      academicTermId = currentTerm._id;
    }

    // RBAC: Teachers can only create assignments for their assigned classes/subjects
    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (!tp || !tp.classes.map(String).includes(rest.classId) || !tp.subjects.map(String).includes(rest.subjectId)) {
        throw new ForbiddenError("You are not assigned to this class or subject");
      }
    }

    const assignment = await Assignment.create({
      ...rest,
      totalMarks: marks,
      academicTermId,
      attachments,
      status: rest.status || "published",
      createdBy: req.user!._id,
    });

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ASSIGNMENT_CREATED",
      entity: "Assignment",
      entityId: assignment._id,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Assignment"),
      data: assignment,
    });
  });

  /** Get assignments with filtering. */
  getAssignments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const user = req.user!;
    let filter: any = {};

    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.status) filter.status = req.query.status;

    // Students & parents only see published assignments for their enrolled class
    if (user.role === "student") {
      const enrollment = await Enrollment.findOne({
        studentId: user._id,
        status: "active",
      });
      if (enrollment) {
        filter.classId = enrollment.classId;
      } else {
        const profile = await StudentProfile.findOne({ userId: user._id });
        if (profile?.classId) {
          filter.classId = profile.classId;
        } else {
          filter.classId = { $in: [] };
        }
      }
      filter.status = "published";
    }
    if (user.role === "parent") {
      const parentProfile = await ParentProfile.findOne({ userId: user._id });
      if (parentProfile && parentProfile.childrenIds.length > 0) {
        const enrollments = await Enrollment.find({
          studentId: { $in: parentProfile.childrenIds },
          status: "active",
        });
        filter.classId = { $in: enrollments.map((e) => e.classId) };
        filter.status = "published";
      } else {
        filter.classId = { $in: [] };
      }
    }
    if (user.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: user._id });
      if (tp) {
        filter.$or = [
          { createdBy: user._id },
          { 
            $and: [
              { classId: { $in: tp.classes } },
              { subjectId: { $in: tp.subjects } }
            ]
          }
        ];
      } else {
        filter.createdBy = user._id;
      }
    }

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate("classId", "name section")
        .populate("subjectId", "name code")
        .populate("createdBy", "firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Assignments"),
      data: assignments,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single assignment by ID. */
  getAssignment = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await Assignment.findById(req.params.id).populate(
      "classId subjectId createdBy",
    );
    if (!assignment) throw new NotFoundError(MESSAGES.NOT_FOUND("Assignment"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Assignment"),
      data: assignment,
    });
  });

  /** Update an assignment. */
  updateAssignment = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!assignment) throw new NotFoundError(MESSAGES.NOT_FOUND("Assignment"));
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ASSIGNMENT_UPDATED",
      entity: "Assignment",
      entityId: assignment._id,
      metadata: req.body,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Assignment"),
      data: assignment,
    });
  });

  /** Delete an assignment (soft). */
  deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!assignment) throw new NotFoundError(MESSAGES.NOT_FOUND("Assignment"));
    ApiResponse.success(res, { message: MESSAGES.DELETED("Assignment") });
  });

  /** Submit an assignment (student). */
  submitAssignment = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new NotFoundError(MESSAGES.NOT_FOUND("Assignment"));
    if (assignment.status !== "published")
      throw new BadRequestError("Assignment is not published");

    const existing = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: req.user!._id,
    });
    if (existing) throw new ConflictError(MESSAGES.ALREADY_SUBMITTED);

    let contentStr = req.body.content || "";
    const uploadedAttachments: string[] = [];

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "assignments/submissions",
        req.file.mimetype
      );
      uploadedAttachments.push(result.secure_url);
    }
    
    if (!contentStr && uploadedAttachments.length === 0) {
      throw new BadRequestError("You must provide either text content or a file upload");
    }

    const submissionStatus =
      new Date() > assignment.dueDate ? "late" : "submitted";
    const submission = await AssignmentSubmission.create({
      assignmentId: assignment._id,
      studentId: req.user!._id,
      content: contentStr,
      attachments: uploadedAttachments,
      status: submissionStatus,
    });

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ASSIGNMENT_SUBMITTED",
      entity: "AssignmentSubmission",
      entityId: submission._id,
      metadata: { assignmentId: assignment._id },
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.ASSIGNMENT_SUBMITTED,
      data: submission,
    });
  });

  /** Get submissions for an assignment (teacher). */
  getSubmissions = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = { assignmentId: req.params.id };

    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(filter)
        .populate("studentId", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AssignmentSubmission.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Submissions"),
      data: submissions,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Provide feedback on a submission/assignment (teacher). */
  createFeedback = asyncHandler(async (req: Request, res: Response) => {
    const feedback = await Feedback.create({
      ...req.body,
      teacherId: req.user!._id,
    });

    // If providing feedback on a submission, update its status
    if (req.body.submissionId) {
      await AssignmentSubmission.findByIdAndUpdate(req.body.submissionId, {
        status: "graded",
        marks: req.body.marks,
      });
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "FEEDBACK_CREATED",
      entity: "Feedback",
      entityId: feedback._id,
      metadata: {
        assignmentId: req.body.assignmentId,
        studentId: req.body.studentId,
      },
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Feedback"),
      data: feedback,
    });
  });

  /** Get feedback for a student. */
  getStudentFeedback = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.params.studentId;
    const user = req.user!;

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
    const [feedback, total] = await Promise.all([
      Feedback.find({ studentId })
        .populate("assignmentId", "title")
        .populate("teacherId", "firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments({ studentId }),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Feedback"),
      data: feedback,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });
}

export const assignmentController = new AssignmentController();
