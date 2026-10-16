import fs from "fs";
import path from "path";
import { env } from "./env";
import { logger } from "../utils/logger";
import { Class, Subject } from "../models";
import { authService } from "../services/auth.service";

/**
 * Lightweight dummy seed for local/dev only.
 * Creates one class, one subject, and invites one teacher + one student.
 * After running, attempts to delete this seed file to leave no residue.
 */
export const seedDummy = async (): Promise<void> => {
  if (!env.SEED_DUMMY) return;

  try {
    logger.info("Running lightweight dummy seed (SEED_DUMMY=true)");

    const cls = await Class.findOne({ name: "Grade 1" });
    const classObj =
      cls ||
      (await Class.create({ name: "Grade 1", section: "A", isActive: true }));

    const subj = await Subject.findOne({
      code: "ENG101",
      classId: classObj._id,
    });
    if (!subj) {
      await Subject.create({
        name: "English",
        code: "ENG101",
        classId: classObj._id,
        description: "Basic English",
      });
    }

    // Invite teacher
    try {
      await authService.inviteUser({
        firstName: "Demo",
        lastName: "Teacher",
        email: "demo.teacher@example.com",
        role: "teacher",
      });
    } catch (e) {
      // ignore if exists
    }

    // Invite student
    try {
      await authService.inviteUser({
        firstName: "Demo",
        lastName: "Student",
        email: "demo.student@example.com",
        role: "student",
      });
    } catch (e) {
      // ignore
    }

    logger.info("Dummy seed complete — attempting to remove seedDummy.ts");

    // Attempt to delete this file so seeding is one-time (best-effort)
    try {
      const filePath = path.resolve(__dirname, "seedDummy.ts");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info("seedDummy.ts removed from source tree");
      }
    } catch (err) {
      logger.warn(
        "Could not remove seedDummy.ts; you can remove it manually.",
        err,
      );
    }
  } catch (error) {
    logger.error("Dummy seed failed:", error);
  }
};

export default seedDummy;
