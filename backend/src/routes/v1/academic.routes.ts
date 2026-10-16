import { Router } from "express";
import { academicController } from "../../controllers/academic.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requireRole,
  requireRoleOrAdmin,
} from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createAcademicTermSchema,
  updateAcademicTermSchema,
  createEnrollmentSchema,
  studentProfileSchema,
  parentProfileSchema,
  teacherProfileSchema,
} from "../../validators/common.validator";

const router = Router();
router.use(authenticate);

// ===== Classes =====
router.post(
  "/classes",
  requireRole("admin"),
  validate(createClassSchema),
  academicController.createClass,
);
router.get("/classes", academicController.getClasses);
router.get("/classes/:id", academicController.getClass);
router.put(
  "/classes/:id",
  requireRoleOrAdmin("teacher"),
  validate(updateClassSchema),
  academicController.updateClass,
);
router.delete(
  "/classes/:id",
  requireRole("admin"),
  academicController.deleteClass,
);

// ===== Subjects =====
router.post(
  "/subjects",
  requireRole("admin"),
  validate(createSubjectSchema),
  academicController.createSubject,
);
router.get("/subjects", academicController.getSubjects);
router.get("/subjects/:id", academicController.getSubject);
router.put(
  "/subjects/:id",
  requireRole("admin"),
  validate(updateSubjectSchema),
  academicController.updateSubject,
);
router.delete(
  "/subjects/:id",
  requireRole("admin"),
  academicController.deleteSubject,
);

// ===== Academic Terms =====
router.post(
  "/academic-terms",
  requireRole("admin"),
  validate(createAcademicTermSchema),
  academicController.createAcademicTerm,
);
router.get("/academic-terms", academicController.getAcademicTerms);
router.get("/academic-terms/:id", academicController.getAcademicTerm);
router.put(
  "/academic-terms/:id",
  requireRole("admin"),
  validate(updateAcademicTermSchema),
  academicController.updateAcademicTerm,
);
router.delete(
  "/academic-terms/:id",
  requireRole("admin"),
  academicController.deleteAcademicTerm,
);

// ===== Enrollments =====
router.post(
  "/enrollments",
  requireRole("admin"),
  validate(createEnrollmentSchema),
  academicController.createEnrollment,
);
router.get(
  "/enrollments",
  requireRoleOrAdmin("teacher"),
  academicController.getEnrollments,
);
router.put(
  "/enrollments/:id",
  requireRole("admin"),
  academicController.updateEnrollment,
);
router.delete(
  "/enrollments/:id",
  requireRole("admin"),
  academicController.deleteEnrollment,
);

// ===== Profiles =====
router.put(
  "/students/:id/profile",
  requireRole("admin"),
  validate(studentProfileSchema),
  academicController.updateStudentProfile,
);
router.put(
  "/parents/:id/profile",
  requireRole("admin"),
  validate(parentProfileSchema),
  academicController.updateParentProfile,
);
router.put(
  "/teachers/:id/profile",
  requireRole("admin"),
  validate(teacherProfileSchema),
  academicController.updateTeacherProfile,
);
router.get("/students/:id", academicController.getStudentData);

export default router;
