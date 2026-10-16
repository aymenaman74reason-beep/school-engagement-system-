import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import academicRoutes from "./academic.routes";
import attendanceRoutes from "./attendance.routes";
import gradeRoutes from "./grade.routes";
import assignmentRoutes from "./assignment.routes";
import semesterRoutes from "./semester.routes";
import dismissalRoutes from "./dismissal.routes";
import certificateRoutes from "./certificate.routes";
import {
  notificationRouter,
  announcementRouter,
  messageRouter,
} from "./communication.routes";
import {
  reportRouter,
  auditLogRouter,
  schoolConfigRouter,
} from "./admin.routes";

const router = Router();

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount all route modules
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/academic", academicRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/grades", gradeRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/semesters", semesterRoutes);
router.use("/dismissals", dismissalRoutes);
router.use("/certificates", certificateRoutes);
router.use("/notifications", notificationRouter);
router.use("/announcements", announcementRouter);
router.use("/messages", messageRouter);
router.use("/reports", reportRouter);
router.use("/audit-logs", auditLogRouter);
router.use("/school-config", schoolConfigRouter);

export default router;

