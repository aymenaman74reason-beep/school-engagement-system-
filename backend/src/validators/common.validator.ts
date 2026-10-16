import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid ID format");

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  role: z.enum(["admin", "teacher", "student", "parent"]).optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(50),
  section: z.string().max(10).optional(),
  academicTermId: objectIdSchema.optional(),
  academicYear: z.string().max(10).optional(),
  classTeacherId: objectIdSchema.optional(),
  capacity: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  room: z.string().max(20).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().min(1, "Subject code is required").max(20),
  description: z.string().max(500).optional(),
  classId: objectIdSchema,
  creditHours: z.number().int().min(0).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createAcademicTermSchema = z.object({
  name: z.string().min(1, "Term name is required").max(100),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  year: z.number().int().min(2000).max(2100),
  type: z.enum(["semester", "trimester", "quarter", "annual"]),
  isCurrent: z.boolean().optional(),
});

export const updateAcademicTermSchema = createAcademicTermSchema.partial();

export const createEnrollmentSchema = z.object({
  studentId: objectIdSchema,
  classId: objectIdSchema,
  academicTermId: objectIdSchema,
  status: z
    .enum(["active", "transferred", "withdrawn", "completed"])
    .optional(),
  remarks: z.string().max(500).optional(),
});

export const markAttendanceSchema = z.object({
  studentId: objectIdSchema,
  classId: objectIdSchema,
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  status: z.enum(["present", "absent", "late", "excused"]),
  academicTermId: objectIdSchema,
  remarks: z.string().max(500).optional(),
});

export const bulkAttendanceSchema = z.object({
  classId: objectIdSchema,
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  academicTermId: objectIdSchema,
  records: z
    .array(
      z.object({
        studentId: objectIdSchema,
        status: z.enum(["present", "absent", "late", "excused"]),
        remarks: z.string().max(500).optional(),
      }),
    )
    .min(1, "At least one attendance record is required"),
});

export const createGradeSchema = z.object({
  studentId: objectIdSchema,
  subjectId: objectIdSchema,
  classId: objectIdSchema,
  academicTermId: objectIdSchema,
  scores: z
    .array(
      z.object({
        name: z.string().min(1),
        score: z.number().min(0),
        maxScore: z.number().min(1),
        weight: z.number().min(0).max(100).optional(),
      }),
    )
    .min(1, "At least one score is required"),
  grade: z.string().max(5).optional(),
  remarks: z.string().max(500).optional(),
  performanceLevel: z.enum([
    "excellent",
    "very_good",
    "good",
    "satisfactory",
    "needs_improvement",
    "poor",
  ]).optional(),
  isPublished: z.boolean().optional(),
});

export const updateGradeSchema = createGradeSchema.partial().omit({
  studentId: true,
  subjectId: true,
  classId: true,
  academicTermId: true,
});

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  classId: objectIdSchema,
  subjectId: objectIdSchema.optional().or(z.literal("")), // Allow empty but handled in controller
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid due date"),
  totalMarks: z.coerce.number().int().min(1, "Total marks must be at least 1"),
  academicTermId: objectIdSchema.optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
});

export const createFeedbackSchema = z.object({
  submissionId: objectIdSchema.optional(),
  assignmentId: objectIdSchema,
  studentId: objectIdSchema,
  comment: z.string().min(1, "Comment is required"),
  grade: z.string().max(5).optional(),
  marks: z.number().min(0).optional(),
  type: z.enum(["assignment", "general", "behavioral", "academic"]).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required"),
  targetRole: z
    .enum(["admin", "teacher", "student", "parent", "all"])
    .optional(),
  targetClassId: objectIdSchema.optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  expiresAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const sendMessageSchema = z.object({
  receiverId: objectIdSchema,
  subject: z.string().max(200).optional(),
  content: z.string().min(1, "Message content is required"),
  threadId: z.string().optional(),
});

export const generateReportSchema = z.object({
  type: z.enum([
    "attendance",
    "grade",
    "student_performance",
    "class_performance",
    "user_summary",
    "custom",
  ]),
  title: z.string().min(1, "Title is required").max(200),
  parameters: z.record(z.any()).optional(),
  format: z.enum(["json", "csv", "pdf"]).optional(),
});

export const updateSchoolConfigSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  principalName: z.string().max(100).optional(),
  establishedYear: z.number().int().min(1800).max(2100).optional(),
  settings: z.record(z.any()).optional(),
});

export const studentProfileSchema = z.object({
  enrollmentNo: z.string().min(1, "Enrollment number is required"),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(500).optional(),
  parentIds: z.array(objectIdSchema).optional(),
  classId: objectIdSchema.optional(),
  admissionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  medicalNotes: z.string().max(1000).optional(),
});

export const parentProfileSchema = z.object({
  childrenIds: z.array(objectIdSchema).optional(),
  occupation: z.string().max(100).optional(),
  relationship: z.enum(["father", "mother", "guardian", "other"]).optional(),
  address: z.string().max(500).optional(),
  alternatePhone: z.string().optional(),
});

export const teacherProfileSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().max(100).optional(),
  qualification: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  subjects: z.array(objectIdSchema).optional(),
  classes: z.array(objectIdSchema).optional(),
  dateOfJoining: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .optional(),
  experience: z.number().int().min(0).optional(),
});

export const paginationQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});
