import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole, requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";
import { validate } from "../../middleware/validate.middleware";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  inviteTeacherSchema,
  inviteStudentParentSchema,
} from "../../validators/auth.validator";

const router = Router();

// Public routes
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken,
);

// Protected routes — legacy register (admin/teacher)
router.post(
  "/register",
  authenticate,
  requireRoleOrAdmin("teacher"),
  validate(registerSchema),
  authController.register,
);

// Invite routes — admin invites teachers
router.post(
  "/invite-teacher",
  authenticate,
  requireRole("admin"),
  validate(inviteTeacherSchema),
  authController.inviteTeacher,
);

// Invite routes — teacher invites students/parents
router.post(
  "/invite-user",
  authenticate,
  requireRole("teacher"),
  validate(inviteStudentParentSchema),
  authController.inviteStudentOrParent,
);

router.post("/logout", authenticate, authController.logout);
router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.get("/me", authenticate, authController.getProfile);

export default router;
