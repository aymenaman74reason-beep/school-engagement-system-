import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import v1Routes from "./routes/v1";
import cron from "node-cron";

const app = express();

// Enable trust proxy for rate limiting behind a load balancer (e.g. Render)
app.set("trust proxy", 1);

// Set up a cron job to ping the backend every 9 minutes to keep it alive
cron.schedule("*/9 * * * *", async () => {
  try {
    const healthUrl = `${env.APP_URL}/api/health`;
    const res = await fetch(healthUrl);
    if (res.ok) {
      console.log(
        `[Cron] Warmup ping successful at ${new Date().toISOString()}`,
      );
    }
  } catch (error) {
    console.error("[Cron] Warmup ping failed", error);
  }
});

// ===== Health Check =====
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// ===== Security Middleware =====
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = env.CORS_ORIGIN.split(",");
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ===== Request Parsing =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== Logging =====
if (env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// ===== Rate Limiting =====
app.use("/api/", apiLimiter);

// ===== Static Files (uploads) =====
app.use("/uploads", express.static(env.UPLOAD_DIR));

// ===== API Routes =====
app.use("/api/v1", v1Routes);

// ===== 404 Handler =====
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ===== Global Error Handler =====
app.use(errorHandler);

export default app;
