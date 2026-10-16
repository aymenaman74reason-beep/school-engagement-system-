import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole, requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { dismissalController } from "../../controllers/dismissal.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a dismissal case (admin/teacher)
router.post(
  "/",
  requireRoleOrAdmin("teacher"),
  dismissalController.createCase,
);

// Get all dismissal cases (all roles — filtered by ownership)
router.get(
  "/",
  requireRoleOrAdmin("teacher", "student", "parent"),
  dismissalController.getCases,
);

// Get a single case
router.get(
  "/:id",
  requireRoleOrAdmin("teacher", "student", "parent"),
  dismissalController.getCase,
);

// Add review to a case (admin/teacher)
router.put(
  "/:id/review",
  requireRoleOrAdmin("teacher"),
  dismissalController.addReview,
);

// Resolve a case (admin only)
router.put(
  "/:id/resolve",
  requireRole("admin"),
  dismissalController.resolveCase,
);

export default router;
