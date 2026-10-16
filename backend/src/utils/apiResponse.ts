import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponseOptions {
  statusCode?: number;
  message: string;
  data?: any;
  pagination?: PaginationMeta;
}

interface ApiErrorOptions {
  statusCode: number;
  message: string;
  errors?: any[];
  code?: string;
}

export class ApiResponse {
  /**
   * Send a success response.
   */
  static success(res: Response, options: ApiResponseOptions): Response {
    const { statusCode = 200, message, data, pagination } = options;
    const responseBody: any = {
      success: true,
      message,
    };
    if (data !== undefined) responseBody.data = data;
    if (pagination) responseBody.pagination = pagination;
    return res.status(statusCode).json(responseBody);
  }

  /**
   * Send an error response.
   */
  static error(res: Response, options: ApiErrorOptions): Response {
    const { statusCode, message, errors, code } = options;
    const responseBody: any = {
      success: false,
      message,
    };
    if (code) responseBody.code = code;
    if (errors && errors.length > 0) responseBody.errors = errors;
    return res.status(statusCode).json(responseBody);
  }

  /**
   * Build pagination metadata from query params and total count.
   */
  static buildPagination(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
