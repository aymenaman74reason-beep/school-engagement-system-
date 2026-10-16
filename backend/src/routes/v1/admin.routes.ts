import { Router } from "express";
import { reportController } from "../../controllers/report.controller";
import {
  auditLogController,
  schoolConfigController,
} from "../../controllers/admin.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requireRole,
  requireRoleOrAdmin,
} from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  generateReportSchema,
  updateSchoolConfigSchema,
} from "../../validators/common.validator";

// ===== Reports =====
export const reportRouter = Router();
reportRouter.use(authenticate, requireRoleOrAdmin("teacher"));
reportRouter.post(
  "/",
  validate(generateReportSchema),
  reportController.generateReport,
);
reportRouter.get("/", reportController.getReports);
reportRouter.get("/:id", reportController.getReport);

// ===== Audit Logs =====
export const auditLogRouter = Router();
auditLogRouter.use(authenticate, requireRole("admin"));
auditLogRouter.get("/", auditLogController.getLogs);
auditLogRouter.get("/:id", auditLogController.getLog);

// ===== School Config =====
export const schoolConfigRouter = Router();
schoolConfigRouter.use(authenticate);
schoolConfigRouter.get("/", schoolConfigController.getConfig);
schoolConfigRouter.put(
  "/",
  requireRole("admin"),
  validate(updateSchoolConfigSchema),
  schoolConfigController.updateConfig,
);
