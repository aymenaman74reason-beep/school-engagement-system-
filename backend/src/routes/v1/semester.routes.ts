import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole, requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { semesterController } from "../../controllers/semester.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin-only: progress students between semesters
router.post(
  "/progress",
  requireRole("admin"),
  semesterController.progressStudents,
);

// Get semester records (admin/teacher)
router.get(
  "/records",
  requireRoleOrAdmin("teacher"),
  semesterController.getClassSemesterRecords,
);

// Get rankings for a class
router.get(
  "/rankings/:classId",
  requireRoleOrAdmin("teacher", "student", "parent"),
  semesterController.getClassRanking,
);

// Get student semester history
router.get(
  "/student/:studentId/history",
  requireRoleOrAdmin("teacher", "student", "parent"),
  semesterController.getStudentHistory,
);

// Get current semester status for a student
router.get(
  "/student/:studentId/current",
  requireRoleOrAdmin("teacher", "student", "parent"),
  semesterController.getCurrentStatus,
);

export default router;
