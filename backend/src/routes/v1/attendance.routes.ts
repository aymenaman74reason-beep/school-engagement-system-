import { Router } from "express";
import { attendanceController } from "../../controllers/attendance.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  markAttendanceSchema,
  bulkAttendanceSchema,
} from "../../validators/common.validator";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  requireRoleOrAdmin("teacher"),
  validate(markAttendanceSchema),
  attendanceController.markAttendance,
);
router.post(
  "/bulk",
  requireRoleOrAdmin("teacher"),
  validate(bulkAttendanceSchema),
  attendanceController.bulkMarkAttendance,
);
router.get(
  "/class/:classId",
  requireRoleOrAdmin("teacher"),
  attendanceController.getClassAttendance,
);
router.get("/student/:studentId", attendanceController.getStudentAttendance);
router.get(
  "/summary/:classId",
  requireRoleOrAdmin("teacher"),
  attendanceController.getAttendanceSummary,
);

export default router;
