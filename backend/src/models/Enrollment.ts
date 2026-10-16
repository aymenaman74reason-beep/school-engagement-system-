import mongoose, { Schema } from "mongoose";
import { IEnrollment } from "../types";

const enrollmentSchema = new Schema<IEnrollment>(
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
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "transferred", "withdrawn", "completed"],
      default: "active",
    },
    enrollmentDate: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

enrollmentSchema.index(
  { studentId: 1, classId: 1, academicTermId: 1 },
  { unique: true },
);

enrollmentSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Enrollment = mongoose.model<IEnrollment>(
  "Enrollment",
  enrollmentSchema,
);
