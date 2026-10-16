import { Request, Response } from "express";
import { User, Enrollment } from "../models";
import { StudentProfile, ParentProfile, TeacherProfile } from "../models";
import {
  asyncHandler,
  ApiResponse,
  parsePaginationQuery,
  parseSearchQuery,
} from "../utils";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";

export class UserController {
  /** List all users with pagination, search, and role filtering. */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const search = parseSearchQuery(req, ["firstName", "lastName", "email"]);
    const roleFilter = req.query.role ? { role: req.query.role } : {};
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    const filter = { ...search, ...roleFilter, ...statusFilter };

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Lean for performance
      User.countDocuments(filter),
    ]);

    // Attach minimal profile data for role-specific logic (e.g. classId for students)
    const userIds = users.map(u => u._id);
    const [studentProfiles, parentProfiles, teacherProfiles] = await Promise.all([
      StudentProfile.find({ userId: { $in: userIds } }),
      ParentProfile.find({ userId: { $in: userIds } }),
      TeacherProfile.find({ userId: { $in: userIds } }),
    ]);

    const usersWithProfiles = users.map(user => {
      let profile = null;
      if (user.role === "student") profile = studentProfiles.find(p => p.userId.toString() === user._id.toString());
      if (user.role === "parent") profile = parentProfiles.find(p => p.userId.toString() === user._id.toString());
      if (user.role === "teacher") profile = teacherProfiles.find(p => p.userId.toString() === user._id.toString());
      return { ...user, profile };
    });

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Users"),
      data: { users: usersWithProfiles },
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single user by ID. */
  getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError(MESSAGES.NOT_FOUND("User"));

    let profile: any = null;
    if (user.role === "student")
      profile = await StudentProfile.findOne({ userId: user._id }).populate("classId");
    else if (user.role === "parent")
      profile = await ParentProfile.findOne({ userId: user._id }).populate("childrenIds");
    else if (user.role === "teacher")
      profile = await TeacherProfile.findOne({ userId: user._id }).populate("subjects classes");

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("User"),
      data: { user, profile },
    });
  });

  /** Update a user and their profile. */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { profile: profileData, ...userData } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new NotFoundError(MESSAGES.NOT_FOUND("User"));

    // RBAC: Teachers can only update students and parents
    if (req.user!.role === "teacher" && !["student", "parent"].includes(targetUser.role)) {
      throw new ForbiddenError(MESSAGES.FORBIDDEN);
    }

    // Update User model
    const user = await User.findByIdAndUpdate(req.params.id, userData, {
      new: true,
      runValidators: true,
    });

    // Update Profile model if profileData is provided
    let updatedProfile = null;
    if (profileData) {
      if (user!.role === "student") {
        updatedProfile = await StudentProfile.findOneAndUpdate(
          { userId: user!._id },
          profileData,
          { new: true, runValidators: true }
        );
      } else if (user!.role === "parent") {
        updatedProfile = await ParentProfile.findOneAndUpdate(
          { userId: user!._id },
          profileData,
          { new: true, runValidators: true }
        );
      } else if (user!.role === "teacher") {
        updatedProfile = await TeacherProfile.findOneAndUpdate(
          { userId: user!._id },
          profileData,
          { new: true, runValidators: true }
        );
      }
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "USER_UPDATED",
      entity: "User",
      entityId: user!._id,
      metadata: req.body,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, { 
      message: MESSAGES.UPDATED("User"), 
      data: { user, profile: updatedProfile } 
    });
  });

  /** Soft-delete a user and their profile. */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new NotFoundError(MESSAGES.NOT_FOUND("User"));

    // RBAC: Teachers can only delete students and parents
    if (req.user!.role === "teacher" && !["student", "parent"].includes(targetUser.role)) {
      throw new ForbiddenError(MESSAGES.FORBIDDEN);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isActive: false },
      { new: true },
    );

    // Soft-delete role profile
    if (user!.role === "student") {
      await StudentProfile.findOneAndUpdate({ userId: user!._id }, { isDeleted: true });
    } else if (user!.role === "parent") {
      await ParentProfile.findOneAndUpdate({ userId: user!._id }, { isDeleted: true });
    } else if (user!.role === "teacher") {
      await TeacherProfile.findOneAndUpdate({ userId: user!._id }, { isDeleted: true });
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "USER_DELETED",
      entity: "User",
      entityId: user!._id,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, { message: MESSAGES.DELETED("User") });
  });

  /** Update user status (activate/deactivate/suspend). */
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!["active", "inactive", "suspended"].includes(status)) {
      throw new BadRequestError("Invalid status");
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === "active" },
      { new: true },
    );
    if (!user) throw new NotFoundError(MESSAGES.NOT_FOUND("User"));

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "USER_STATUS_CHANGED",
      entity: "User",
      entityId: user._id,
      metadata: { newStatus: status },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("User status"),
      data: user,
    });
  });

  /** Get teachers for parents to message. Populates subjects and classes. */
  getTeachersForMessaging = asyncHandler(async (req: Request, res: Response) => {
    // Find all active teachers
    const teachers = await User.find({ role: "teacher", isActive: true });
    
    // Get profiles and populate
    const teacherProfiles = await TeacherProfile.find({ 
      userId: { $in: teachers.map(t => t._id) }
    })
    .populate("userId", "firstName lastName email")
    .populate("subjects", "name code")
    .populate("classes", "name section");

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Teachers"),
      data: teacherProfiles,
    });
  });

  /** Get parents for teachers to message. Only parents of students in the teacher's classes. */
  getParentsForTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!._id;
    const tp = await TeacherProfile.findOne({ userId: teacherId });
    if (!tp) throw new NotFoundError(MESSAGES.NOT_FOUND("Teacher Profile"));

    // Find all students in teacher's classes
    const enrollments = await Enrollment.find({ classId: { $in: tp.classes } });
    const studentIds = enrollments.map(e => e.studentId);

    // Find all parents of these students
    const parentProfiles = await ParentProfile.find({
      childrenIds: { $in: studentIds }
    }).populate("userId", "firstName lastName email phone");

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Parents"),
      data: parentProfiles
    });
  });
}

export const userController = new UserController();
