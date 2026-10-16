import { Router } from "express";
import { gradeController } from "../../controllers/grade.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createGradeSchema,
  updateGradeSchema,
} from "../../validators/common.validator";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  requireRoleOrAdmin("teacher"),
  validate(createGradeSchema),
  gradeController.createGrade,
);
router.put(
  "/:id",
  requireRoleOrAdmin("teacher"),
  validate(updateGradeSchema),
  gradeController.updateGrade,
);
router.get("/student/:studentId", gradeController.getStudentGrades);
router.get(
  "/class/:classId/subject/:subjectId",
  requireRoleOrAdmin("teacher"),
  gradeController.getClassSubjectGrades,
);
router.get(
  "/summary/:classId",
  requireRoleOrAdmin("teacher"),
  gradeController.getGradeSummary,
);

export default router;
