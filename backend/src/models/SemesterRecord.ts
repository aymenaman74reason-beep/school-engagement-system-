import mongoose, { Schema } from "mongoose";
import { ISemesterRecord } from "../types";

const semesterRecordSchema = new Schema<ISemesterRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "promoted",
        "repeated",
        "probation",
        "dismissed",
        "graduated",
        "completed",
      ],
      default: "active",
      index: true,
    },
    gpa: { type: Number, min: 0, max: 4 },
    totalPercentage: { type: Number, min: 0, max: 100 },
    rank: { type: Number, min: 1 },
    totalStudentsInClass: { type: Number, min: 1 },
    remarks: { type: String, trim: true },
    previousTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
    },
    promotedToClassId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
    },
  },
  { timestamps: true },
);

semesterRecordSchema.index(
  { studentId: 1, academicTermId: 1 },
  { unique: true },
);

export const SemesterRecord = mongoose.model<ISemesterRecord>(
  "SemesterRecord",
  semesterRecordSchema,
);
