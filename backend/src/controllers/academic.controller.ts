import { Request, Response } from "express";
import {
  Class,
  Subject,
  AcademicTerm,
  Enrollment,
  StudentProfile,
  ParentProfile,
  TeacherProfile,
  User,
} from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";

export class AcademicController {
  // ==================== CLASSES ====================
  createClass = asyncHandler(async (req: Request, res: Response) => {
    const newClass = await Class.create(req.body);
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "CLASS_CREATED",
      entity: "Class",
      entityId: newClass._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Class"),
      data: newClass,
    });
  });

  getClasses = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";

    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (tp) {
        filter._id = { $in: tp.classes };
      } else {
        filter._id = { $in: [] };
      }
    }

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate("classTeacherId", "firstName lastName")
        .populate("academicTermId", "name year")
        .populate("subjects")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Class.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Classes"),
      data: classes,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  getClass = asyncHandler(async (req: Request, res: Response) => {
    const cls = await Class.findById(req.params.id)
      .populate("classTeacherId teacherIds", "firstName lastName email")
      .populate("academicTermId")
      .populate("subjects");
    if (!cls) throw new NotFoundError(MESSAGES.NOT_FOUND("Class"));
    ApiResponse.success(res, { message: MESSAGES.FETCHED("Class"), data: cls });
  });

  updateClass = asyncHandler(async (req: Request, res: Response) => {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cls) throw new NotFoundError(MESSAGES.NOT_FOUND("Class"));
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "CLASS_UPDATED",
      entity: "Class",
      entityId: cls._id,
      metadata: req.body,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, { message: MESSAGES.UPDATED("Class"), data: cls });
  });

  deleteClass = asyncHandler(async (req: Request, res: Response) => {
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!cls) throw new NotFoundError(MESSAGES.NOT_FOUND("Class"));
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "CLASS_DELETED",
      entity: "Class",
      entityId: cls._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, { message: MESSAGES.DELETED("Class") });
  });

  // ==================== SUBJECTS ====================
  createSubject = asyncHandler(async (req: Request, res: Response) => {
    const subject = await Subject.create(req.body);
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "SUBJECT_CREATED",
      entity: "Subject",
      entityId: subject._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Subject"),
      data: subject,
    });
  });

  getSubjects = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";
    if (req.query.classId) filter.classId = req.query.classId;

    if (req.user!.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user!._id });
      if (tp) {
        filter._id = { $in: tp.subjects };
      } else {
        filter._id = { $in: [] };
      }
    }

    const [subjects, total] = await Promise.all([
      Subject.find(filter).sort(sort).skip(skip).limit(limit),
      Subject.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Subjects"),
      data: subjects,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  getSubject = asyncHandler(async (req: Request, res: Response) => {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw new NotFoundError(MESSAGES.NOT_FOUND("Subject"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Subject"),
      data: subject,
    });
  });

  updateSubject = asyncHandler(async (req: Request, res: Response) => {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) throw new NotFoundError(MESSAGES.NOT_FOUND("Subject"));
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Subject"),
      data: subject,
    });
  });

  deleteSubject = asyncHandler(async (req: Request, res: Response) => {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!subject) throw new NotFoundError(MESSAGES.NOT_FOUND("Subject"));
    ApiResponse.success(res, { message: MESSAGES.DELETED("Subject") });
  });

  // ==================== ACADEMIC TERMS ====================
  createAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    // If setting as current, unset others
    if (req.body.isCurrent) {
      await AcademicTerm.updateMany({}, { isCurrent: false });
    }
    const term = await AcademicTerm.create(req.body);
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ACADEMIC_TERM_CREATED",
      entity: "AcademicTerm",
      entityId: term._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Academic Term"),
      data: term,
    });
  });

  getAcademicTerms = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.isCurrent) filter.isCurrent = req.query.isCurrent === "true";
    if (req.query.year) filter.year = parseInt(req.query.year as string);
    
    // Default sort by year and start date if no specific sortBy is provided
    const finalSort: any = req.query.sortBy ? sort : { year: -1, startDate: -1 };

    const [terms, total] = await Promise.all([
      AcademicTerm.find(filter).sort(finalSort).skip(skip).limit(limit),
      AcademicTerm.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Academic Terms"),
      data: terms,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  getAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    const term = await AcademicTerm.findById(req.params.id);
    if (!term) throw new NotFoundError(MESSAGES.NOT_FOUND("Academic Term"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Academic Term"),
      data: term,
    });
  });

  updateAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    // If setting as current, unset others
    if (req.body.isCurrent) {
      await AcademicTerm.updateMany({ _id: { $ne: req.params.id } }, { isCurrent: false });
    }
    const term = await AcademicTerm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!term) throw new NotFoundError(MESSAGES.NOT_FOUND("Academic Term"));
    
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ACADEMIC_TERM_UPDATED",
      entity: "AcademicTerm",
      entityId: term._id,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Academic Term"),
      data: term,
    });
  });

  deleteAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    const term = await AcademicTerm.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!term) throw new NotFoundError(MESSAGES.NOT_FOUND("Academic Term"));
    ApiResponse.success(res, { message: MESSAGES.DELETED("Academic Term") });
  });

  // ==================== ENROLLMENTS ====================
  createEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await Enrollment.create(req.body);
    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ENROLLMENT_CREATED",
      entity: "Enrollment",
      entityId: enrollment._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Enrollment"),
      data: enrollment,
    });
  });

  getEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;
    if (req.query.status) filter.status = req.query.status;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate("studentId", "firstName lastName email")
        .populate("classId", "name section")
        .populate("academicTermId", "name year")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Enrollments"),
      data: enrollments,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!enrollment) throw new NotFoundError(MESSAGES.NOT_FOUND("Enrollment"));
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Enrollment"),
      data: enrollment,
    });
  });

  deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!enrollment) throw new NotFoundError(MESSAGES.NOT_FOUND("Enrollment"));
    ApiResponse.success(res, { message: MESSAGES.DELETED("Enrollment") });
  });

  // ==================== PROFILES ====================
  updateStudentProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true, upsert: true },
    );
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Student Profile"),
      data: profile,
    });
  });

  updateParentProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await ParentProfile.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true, upsert: true },
    );
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Parent Profile"),
      data: profile,
    });
  });

  updateTeacherProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await TeacherProfile.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true, upsert: true },
    );
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Teacher Profile"),
      data: profile,
    });
  });

  /** Get student data — respects ownership for students/parents. */
  getStudentData = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.params.id;
    const user = req.user!;

    // Ownership check for students
    if (user.role === "student" && user._id.toString() !== studentId) {
      throw new ForbiddenError(MESSAGES.FORBIDDEN);
    }

    // Ownership check for parents
    if (user.role === "parent") {
      const parentProfile = await ParentProfile.findOne({ userId: user._id });
      if (!parentProfile) throw new ForbiddenError("Parent profile not found");
      
      const isChild = parentProfile.childrenIds.some(id => id.toString() === studentId);
      if (!isChild) {
        throw new ForbiddenError("This student is not linked to your account");
      }
    }

    const student = await User.findById(studentId);
    if (!student) throw new NotFoundError(MESSAGES.NOT_FOUND("Student"));
    const profile = await StudentProfile.findOne({
      userId: studentId,
    }).populate("parentIds", "firstName lastName email phone");

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Student"),
      data: { student, profile },
    });
  });
}

export const academicController = new AcademicController();
