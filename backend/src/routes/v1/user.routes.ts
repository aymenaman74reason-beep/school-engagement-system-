import { Router } from "express";
import { userController } from "../../controllers/user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole, requireRoleOrAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateUserSchema } from "../../validators/common.validator";

const router = Router();

router.use(authenticate);

router.get("/", requireRoleOrAdmin("teacher"), userController.getUsers);
router.get("/teachers/messaging", requireRoleOrAdmin("parent"), userController.getTeachersForMessaging);
router.get("/parents/messaging", requireRoleOrAdmin("teacher"), userController.getParentsForTeacher);
router.get("/:id", requireRoleOrAdmin("teacher"), userController.getUser);
router.put("/:id", requireRoleOrAdmin("teacher"), validate(updateUserSchema), userController.updateUser);
router.delete("/:id", requireRoleOrAdmin("teacher"), userController.deleteUser);
router.put("/:id/status", requireRole("admin"), userController.updateUserStatus);

export default router;
