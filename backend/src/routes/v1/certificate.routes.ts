import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole, requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { certificateController } from "../../controllers/certificate.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate a certificate (admin/teacher)
router.post(
  "/",
  requireRoleOrAdmin("teacher"),
  certificateController.generate,
);

// Check eligibility
router.get(
  "/eligibility",
  requireRoleOrAdmin("teacher"),
  certificateController.checkEligibility,
);

// Get all certificates (admin)
router.get(
  "/",
  requireRole("admin"),
  certificateController.getAllCertificates,
);

// Get certificates for a student
router.get(
  "/student/:studentId",
  requireRoleOrAdmin("teacher", "student", "parent"),
  certificateController.getStudentCertificates,
);

// Get a single certificate
router.get(
  "/:id",
  requireRoleOrAdmin("teacher", "student", "parent"),
  certificateController.getCertificate,
);

// Download certificate as HTML
router.get(
  "/:id/download",
  requireRoleOrAdmin("teacher", "student", "parent"),
  certificateController.downloadCertificate,
);

export default router;
