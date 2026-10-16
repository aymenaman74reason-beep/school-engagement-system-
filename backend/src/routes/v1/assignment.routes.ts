import { Router } from "express";
import { assignmentController } from "../../controllers/assignment.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requireRole,
  requireRoleOrAdmin,
} from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  createFeedbackSchema,
} from "../../validators/common.validator";

const router = Router();
router.use(authenticate);

import { upload } from "../../middleware/upload.middleware";

// Assignment CRUD (teacher/admin)
router.post(
  "/",
  requireRoleOrAdmin("teacher"),
  upload.single("file"),
  validate(createAssignmentSchema),
  assignmentController.createAssignment,
);
router.get("/", assignmentController.getAssignments);
router.get("/:id", assignmentController.getAssignment);
router.put(
  "/:id",
  requireRoleOrAdmin("teacher"),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment,
);
router.delete(
  "/:id",
  requireRoleOrAdmin("teacher"),
  assignmentController.deleteAssignment,
);

// Submissions
router.post(
  "/:id/submit",
  requireRole("student"),
  upload.single("file"), // Handle multipart form data
  assignmentController.submitAssignment,
);
router.get(
  "/:id/submissions",
  requireRoleOrAdmin("teacher"),
  assignmentController.getSubmissions,
);

// Feedback
router.post(
  "/feedback",
  requireRoleOrAdmin("teacher"),
  validate(createFeedbackSchema),
  assignmentController.createFeedback,
);
router.get(
  "/feedback/student/:studentId",
  assignmentController.getStudentFeedback,
);

export default router;
