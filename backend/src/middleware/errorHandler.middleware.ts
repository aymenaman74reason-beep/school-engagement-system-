import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { ApiResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Global error handler middleware — must be registered last.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`${err.message}`, {
    path: req.path,
    method: req.method,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Operational errors (thrown intentionally)
  if (err instanceof AppError) {
    const response: any = {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError) {
      response.errors = err.errors;
    }

    ApiResponse.error(res, response);
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const mongooseErr = err as any;
    const errors = Object.values(mongooseErr.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    ApiResponse.error(res, {
      statusCode: 422,
      message: "Validation failed",
      errors,
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    ApiResponse.error(res, {
      statusCode: 409,
      message: `Duplicate value for field: ${field}`,
      code: "DUPLICATE_KEY",
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    ApiResponse.error(res, {
      statusCode: 400,
      message: "Invalid ID format",
      code: "INVALID_ID",
    });
    return;
  }

  // Unexpected errors
  ApiResponse.error(res, {
    statusCode: 500,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : err.message,
    code: "SERVER_ERROR",
  });
};
