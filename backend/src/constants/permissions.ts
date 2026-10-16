/**
 * Fine-grained permissions for RBAC.
 * Format: RESOURCE_ACTION
 */
export enum Permissions {
  // User management
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_MANAGE = "user:manage",

  // Student operations
  STUDENT_READ = "student:read",
  STUDENT_UPDATE = "student:update",
  STUDENT_READ_OWN = "student:read_own",

  // Parent operations
  PARENT_READ = "parent:read",
  PARENT_READ_OWN = "parent:read_own",
  PARENT_READ_CHILDREN = "parent:read_children",

  // Teacher operations
  TEACHER_READ = "teacher:read",
  TEACHER_UPDATE = "teacher:update",

  // Class management
  CLASS_CREATE = "class:create",
  CLASS_READ = "class:read",
  CLASS_UPDATE = "class:update",
  CLASS_DELETE = "class:delete",

  // Subject management
  SUBJECT_CREATE = "subject:create",
  SUBJECT_READ = "subject:read",
  SUBJECT_UPDATE = "subject:update",
  SUBJECT_DELETE = "subject:delete",

  // Academic term management
  TERM_CREATE = "term:create",
  TERM_READ = "term:read",
  TERM_UPDATE = "term:update",
  TERM_DELETE = "term:delete",

  // Attendance
  ATTENDANCE_CREATE = "attendance:create",
  ATTENDANCE_READ = "attendance:read",
  ATTENDANCE_UPDATE = "attendance:update",
  ATTENDANCE_READ_OWN = "attendance:read_own",

  // Grades
  GRADE_CREATE = "grade:create",
  GRADE_READ = "grade:read",
  GRADE_UPDATE = "grade:update",
  GRADE_READ_OWN = "grade:read_own",

  // Assignments
  ASSIGNMENT_CREATE = "assignment:create",
  ASSIGNMENT_READ = "assignment:read",
  ASSIGNMENT_UPDATE = "assignment:update",
  ASSIGNMENT_DELETE = "assignment:delete",
  ASSIGNMENT_SUBMIT = "assignment:submit",
  ASSIGNMENT_READ_OWN = "assignment:read_own",

  // Feedback
  FEEDBACK_CREATE = "feedback:create",
  FEEDBACK_READ = "feedback:read",
  FEEDBACK_READ_OWN = "feedback:read_own",

  // Notifications
  NOTIFICATION_CREATE = "notification:create",
  NOTIFICATION_READ = "notification:read",
  NOTIFICATION_READ_OWN = "notification:read_own",

  // Announcements
  ANNOUNCEMENT_CREATE = "announcement:create",
  ANNOUNCEMENT_READ = "announcement:read",
  ANNOUNCEMENT_UPDATE = "announcement:update",
  ANNOUNCEMENT_DELETE = "announcement:delete",

  // Reports
  REPORT_GENERATE = "report:generate",
  REPORT_READ = "report:read",

  // Audit logs
  AUDIT_READ = "audit:read",

  // School config
  SCHOOL_CONFIG_READ = "school_config:read",
  SCHOOL_CONFIG_UPDATE = "school_config:update",

  // Messages
  MESSAGE_CREATE = "message:create",
  MESSAGE_READ = "message:read",
  MESSAGE_READ_OWN = "message:read_own",

  // Enrollment
  ENROLLMENT_CREATE = "enrollment:create",
  ENROLLMENT_READ = "enrollment:read",
  ENROLLMENT_UPDATE = "enrollment:update",
  ENROLLMENT_DELETE = "enrollment:delete",

  // Semester progression
  SEMESTER_CREATE = "semester:create",
  SEMESTER_READ = "semester:read",
  SEMESTER_PROGRESS = "semester:progress",

  // Dismissal cases
  DISMISSAL_CREATE = "dismissal:create",
  DISMISSAL_READ = "dismissal:read",
  DISMISSAL_UPDATE = "dismissal:update",
  DISMISSAL_READ_OWN = "dismissal:read_own",

  // Certificates
  CERTIFICATE_CREATE = "certificate:create",
  CERTIFICATE_READ = "certificate:read",
  CERTIFICATE_READ_OWN = "certificate:read_own",

  // Rankings
  RANKING_READ = "ranking:read",
  RANKING_COMPUTE = "ranking:compute",
}

import { Roles } from "./roles";

/**
 * Role-permission mapping. Each role gets a set of permissions.
 */
export const ROLE_PERMISSIONS: Record<string, Permissions[]> = {
  [Roles.ADMIN]: Object.values(Permissions), // Admin has all permissions

  [Roles.TEACHER]: [
    Permissions.USER_CREATE,
    Permissions.STUDENT_READ,
    Permissions.PARENT_READ,
    Permissions.TEACHER_READ,
    Permissions.TEACHER_UPDATE,
    Permissions.CLASS_READ,
    Permissions.SUBJECT_READ,
    Permissions.TERM_READ,
    Permissions.ENROLLMENT_READ,
    Permissions.ATTENDANCE_CREATE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_UPDATE,
    Permissions.GRADE_CREATE,
    Permissions.GRADE_READ,
    Permissions.GRADE_UPDATE,
    Permissions.ASSIGNMENT_CREATE,
    Permissions.ASSIGNMENT_READ,
    Permissions.ASSIGNMENT_UPDATE,
    Permissions.ASSIGNMENT_DELETE,
    Permissions.FEEDBACK_CREATE,
    Permissions.FEEDBACK_READ,
    Permissions.NOTIFICATION_READ_OWN,
    Permissions.ANNOUNCEMENT_CREATE,
    Permissions.ANNOUNCEMENT_READ,
    Permissions.REPORT_GENERATE,
    Permissions.REPORT_READ,
    Permissions.MESSAGE_CREATE,
    Permissions.MESSAGE_READ_OWN,
    Permissions.SEMESTER_READ,
    Permissions.DISMISSAL_CREATE,
    Permissions.DISMISSAL_READ,
    Permissions.RANKING_READ,
    Permissions.RANKING_COMPUTE,
    Permissions.CERTIFICATE_READ,
  ],

  [Roles.STUDENT]: [
    Permissions.STUDENT_READ_OWN,
    Permissions.CLASS_READ,
    Permissions.SUBJECT_READ,
    Permissions.TERM_READ,
    Permissions.ATTENDANCE_READ_OWN,
    Permissions.GRADE_READ_OWN,
    Permissions.ASSIGNMENT_READ_OWN,
    Permissions.ASSIGNMENT_SUBMIT,
    Permissions.FEEDBACK_READ_OWN,
    Permissions.NOTIFICATION_READ_OWN,
    Permissions.ANNOUNCEMENT_READ,
    Permissions.SEMESTER_READ,
    Permissions.RANKING_READ,
    Permissions.CERTIFICATE_READ_OWN,
    Permissions.DISMISSAL_READ_OWN,
  ],

  [Roles.PARENT]: [
    Permissions.PARENT_READ_OWN,
    Permissions.PARENT_READ_CHILDREN,
    Permissions.CLASS_READ,
    Permissions.SUBJECT_READ,
    Permissions.TERM_READ,
    Permissions.ATTENDANCE_READ_OWN,
    Permissions.GRADE_READ_OWN,
    Permissions.ASSIGNMENT_READ_OWN,
    Permissions.FEEDBACK_READ_OWN,
    Permissions.NOTIFICATION_READ_OWN,
    Permissions.ANNOUNCEMENT_READ,
    Permissions.MESSAGE_CREATE,
    Permissions.MESSAGE_READ_OWN,
    Permissions.SEMESTER_READ,
    Permissions.RANKING_READ,
    Permissions.CERTIFICATE_READ_OWN,
    Permissions.DISMISSAL_READ_OWN,
  ],
};
