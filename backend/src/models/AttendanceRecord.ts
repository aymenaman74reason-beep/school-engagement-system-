import mongoose, { Schema } from "mongoose";
import { IAttendanceRecord } from "../types";

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late", "excused"],
    },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    remarks: { type: String, trim: true },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
    },
  },
  { timestamps: true },
);

// One attendance record per student per class per subject per date
attendanceRecordSchema.index(
  { studentId: 1, classId: 1, subjectId: 1, date: 1 },
  { unique: true },
);
// For efficient queries by class and date
attendanceRecordSchema.index({ classId: 1, date: 1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
  "AttendanceRecord",
  attendanceRecordSchema,
);
