import { User } from "../models/User";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Seeds the default admin user on startup if none exists.
 * Reads credentials from environment variables.
 * This is idempotent — it only creates the admin if no admin account is found.
 */
export const seedAdmin = async (): Promise<void> => {
  try {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      logger.warn(
        "ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed",
      );
      return;
    }

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      logger.info(`Admin exists. Forcing update to secure .env credentials...`);
      existingAdmin.email = env.ADMIN_EMAIL;
      existingAdmin.password = env.ADMIN_PASSWORD; // Will be hashed by pre-save hook
      existingAdmin.firstName = env.ADMIN_FIRST_NAME;
      existingAdmin.lastName = env.ADMIN_LAST_NAME;
      await existingAdmin.save();
      logger.info(
        `✅ Admin credentials updated successfully to ${env.ADMIN_EMAIL}`,
      );
      return;
    }

    await User.create({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      firstName: env.ADMIN_FIRST_NAME,
      lastName: env.ADMIN_LAST_NAME,
      role: "admin",
      isActive: true,
      status: "active",
    });

    logger.info(`✅ Default admin created: ${env.ADMIN_EMAIL}`);
  } catch (error) {
    logger.error("Failed to seed/update admin user:", error);
  }
};
