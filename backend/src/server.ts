import app from "./app"; // Triggering restart after .env change
import { env } from "./config/env";
import { connectDB } from "./config/database";
import { seedAdmin } from "./config/seedAdmin";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed default admin user if none exists
    await seedAdmin();

    // No dummy seeds run by default.

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`,
      );
      logger.info(`📋 API docs: http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled rejections
    process.on("unhandledRejection", (reason: any) => {
      logger.error("Unhandled Rejection:", reason);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
