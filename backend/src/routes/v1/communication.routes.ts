import { Router } from "express";
import {
  notificationController,
  announcementController,
  messageController,
} from "../../controllers/notification.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requireRole,
  requireRoleOrAdmin,
} from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  sendMessageSchema,
} from "../../validators/common.validator";

// ===== Notifications =====
export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get("/", notificationController.getMyNotifications);
notificationRouter.put("/read-all", notificationController.markAllAsRead);
notificationRouter.put("/:id/read", notificationController.markAsRead);
notificationRouter.post(
  "/",
  requireRoleOrAdmin("teacher"),
  notificationController.createNotification,
);

import { upload } from "../../middleware/upload.middleware";

// ===== Announcements =====
export const announcementRouter = Router();
announcementRouter.use(authenticate);
announcementRouter.post(
  "/",
  requireRoleOrAdmin("teacher"),
  upload.array("images", 5), // Handle multipart images
  validate(createAnnouncementSchema),
  announcementController.createAnnouncement,
);
announcementRouter.get("/", announcementController.getAnnouncements);
announcementRouter.get("/:id", announcementController.getAnnouncement);
announcementRouter.put(
  "/:id",
  requireRoleOrAdmin("teacher"),
  validate(updateAnnouncementSchema),
  announcementController.updateAnnouncement,
);
announcementRouter.delete(
  "/:id",
  requireRoleOrAdmin("teacher"),
  announcementController.deleteAnnouncement,
);

// ===== Messages =====
export const messageRouter = Router();
messageRouter.use(authenticate);
messageRouter.post(
  "/",
  validate(sendMessageSchema),
  messageController.sendMessage,
);
messageRouter.get("/", messageController.getMessages);
messageRouter.get("/unread-count", messageController.getUnreadCount);
messageRouter.get("/threads", messageController.getThreads);
messageRouter.put("/:id/read", messageController.markAsRead);
