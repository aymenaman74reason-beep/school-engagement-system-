export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  REGISTER_SUCCESS: "User registered successfully",
  TOKEN_REFRESH_SUCCESS: "Token refreshed successfully",
  PASSWORD_CHANGE_SUCCESS: "Password changed successfully",
  PASSWORD_RESET_LINK_SENT: "Password reset link sent to your email",
  PASSWORD_RESET_SUCCESS: "Password reset successful",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED:
    "Account is locked due to too many failed login attempts. Please try again later.",
  ACCOUNT_INACTIVE: "Account is inactive. Please contact administrator.",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID: "Invalid token",
  TOKEN_REQUIRED: "Authentication token is required",
  REFRESH_TOKEN_INVALID: "Invalid or expired refresh token",
  PASSWORD_RESET_TOKEN_INVALID: "Invalid or expired password reset token",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",

  // Authorization
  UNAUTHORIZED: "You are not authorized to access this resource",
  FORBIDDEN: "You do not have permission to perform this action",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions",

  // CRUD
  CREATED: (entity: string) => `${entity} created successfully`,
  UPDATED: (entity: string) => `${entity} updated successfully`,
  DELETED: (entity: string) => `${entity} deleted successfully`,
  FETCHED: (entity: string) => `${entity} fetched successfully`,
  NOT_FOUND: (entity: string) => `${entity} not found`,
  ALREADY_EXISTS: (entity: string) => `${entity} already exists`,

  // Validation
  VALIDATION_ERROR: "Validation failed",
  INVALID_ID: "Invalid ID format",
  INVALID_DATE: "Invalid date format",
  FUTURE_DATE_NOT_ALLOWED: "Future date is not allowed for this operation",

  // Attendance
  ATTENDANCE_MARKED: "Attendance marked successfully",
  ATTENDANCE_ALREADY_MARKED: "Attendance already marked for this date",
  ATTENDANCE_BULK_MARKED: "Bulk attendance marked successfully",

  // Grades
  GRADE_ENTERED: "Grade entered successfully",
  GRADE_UPDATED: "Grade updated successfully",
  DUPLICATE_GRADE: "Grade already exists for this student, subject, and term",

  // Assignment
  ASSIGNMENT_SUBMITTED: "Assignment submitted successfully",
  ASSIGNMENT_PAST_DUE: "Assignment is past due date",
  ALREADY_SUBMITTED: "Assignment already submitted",

  // Notification
  NOTIFICATION_SENT: "Notification sent successfully",
  MARKED_AS_READ: "Marked as read",

  // Report
  REPORT_GENERATED: "Report generated successfully",
  REPORT_IN_PROGRESS: "Report generation in progress",

  // Semester
  SEMESTER_PROGRESSED: "Students progressed to next semester successfully",
  SEMESTER_RECORD_CREATED: "Semester record created successfully",

  // Dismissal
  DISMISSAL_CASE_CREATED: "Dismissal case created successfully",
  DISMISSAL_CASE_REVIEWED: "Dismissal case review added successfully",
  DISMISSAL_CASE_RESOLVED: "Dismissal case resolved successfully",

  // Certificate
  CERTIFICATE_GENERATED: "Certificate generated successfully",
  CERTIFICATE_NOT_ELIGIBLE: "Student is not eligible for this certificate",

  // Ranking
  RANKING_COMPUTED: "Rankings computed successfully",

  // Server
  SERVER_ERROR: "Internal server error",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  ROUTE_NOT_FOUND: "Route not found",
};
