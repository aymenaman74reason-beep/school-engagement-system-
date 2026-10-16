import { Document, Types } from "mongoose";

// Extend Express Request to include user info after authentication
declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export interface IAuthUser {
  _id: Types.ObjectId;
  email: string;
  role: string;
  permissions: string[];
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  status: "active" | "inactive" | "suspended" | "locked";
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  isLocked: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IStudentProfile extends Document {
  userId: Types.ObjectId;
  enrollmentNo: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  parentIds: Types.ObjectId[];
  classId?: Types.ObjectId;
  admissionDate?: Date;
  bloodGroup?: string;
  medicalNotes?: string;
  academicStatus?: "active" | "probation" | "dismissed" | "graduated" | "suspended";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IParentProfile extends Document {
  userId: Types.ObjectId;
  childrenIds: Types.ObjectId[];
  occupation?: string;
  relationship?: string;
  address?: string;
  alternatePhone?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeacherProfile extends Document {
  userId: Types.ObjectId;
  employeeId: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  subjects: Types.ObjectId[];
  classes: Types.ObjectId[];
  dateOfJoining?: Date;
  experience?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClass extends Document {
  name: string;
  section?: string;
  academicTermId?: Types.ObjectId;
  academicYear?: string;
  classTeacherId?: Types.ObjectId;
  teacherIds: Types.ObjectId[];
  capacity?: number;
  maxStudents?: number;
  room?: string;
  isActive: boolean;
  isDeleted: boolean;
  subjects?: ISubject[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubject extends Document {
  name: string;
  code: string;
  description?: string;
  classId: Types.ObjectId;
  creditHours?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAcademicTerm extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  year: number;
  type: "semester" | "trimester" | "quarter" | "annual";
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollment extends Document {
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  status: "active" | "transferred" | "withdrawn" | "completed";
  enrollmentDate: Date;
  remarks?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceRecord extends Document {
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  markedBy: Types.ObjectId;
  remarks?: string;
  academicTermId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGradeRecord extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  scores: {
    name: string;
    score: number;
    maxScore: number;
    weight?: number;
  }[];
  totalScore?: number;
  maxTotalScore?: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  performanceLevel?: string;
  enteredBy: Types.ObjectId;
  isPublished: boolean;
  passFail?: "pass" | "fail";
  passThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate: Date;
  totalMarks: number;
  attachments: string[];
  status: "draft" | "published" | "closed";
  academicTermId: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentSubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  content: string;
  attachments: string[];
  submittedAt: Date;
  status: "submitted" | "late" | "graded" | "returned";
  marks?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback extends Document {
  submissionId?: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  comment: string;
  grade?: string;
  marks?: number;
  type: "assignment" | "general" | "behavioral" | "academic";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  type:
    | "attendance"
    | "grade"
    | "assignment"
    | "feedback"
    | "announcement"
    | "message"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  createdBy: Types.ObjectId;
  targetRole?: string;
  targetClassId?: Types.ObjectId;
  priority: "low" | "normal" | "high" | "urgent";
  attachments: string[];
  expiresAt?: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IReport extends Document {
  type:
    | "attendance"
    | "grade"
    | "student_performance"
    | "class_performance"
    | "user_summary"
    | "custom";
  title: string;
  generatedBy: Types.ObjectId;
  parameters: Record<string, any>;
  data?: Record<string, any>;
  filePath?: string;
  status: "pending" | "generating" | "completed" | "failed";
  format: "json" | "csv" | "pdf";
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchoolConfig extends Document {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  principalName?: string;
  establishedYear?: number;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  studentId?: Types.ObjectId;
  threadId?: string;
  subject?: string;
  content: string;
  attachments: string[];
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface ISemesterRecord extends Document {
  studentId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  classId: Types.ObjectId;
  status:
    | "active"
    | "promoted"
    | "repeated"
    | "probation"
    | "dismissed"
    | "graduated"
    | "completed";
  gpa?: number;
  totalPercentage?: number;
  rank?: number;
  totalStudentsInClass?: number;
  remarks?: string;
  previousTermId?: Types.ObjectId;
  promotedToClassId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDismissalCase extends Document {
  studentId: Types.ObjectId;
  type: "academic" | "discipline";
  reason: string;
  description?: string;
  status:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "appealed";
  initiatedBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewHistory: {
    reviewer: Types.ObjectId;
    action: "reviewed" | "approved" | "rejected" | "appealed" | "comment";
    comment?: string;
    date: Date;
  }[];
  outcome?: string;
  effectiveDate?: Date;
  academicTermId?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificate extends Document {
  studentId: Types.ObjectId;
  type: "completion" | "merit" | "participation" | "excellence";
  academicTermId: Types.ObjectId;
  classId: Types.ObjectId;
  issuedDate: Date;
  issuedBy: Types.ObjectId;
  status: "draft" | "issued" | "revoked";
  certificateNumber: string;
  metadata: {
    gpa?: number;
    rank?: number;
    totalStudents?: number;
    percentage?: number;
    remarks?: string;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
