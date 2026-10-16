import mongoose, { Schema } from "mongoose";
import { IStudentProfile } from "../types";

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    enrollmentNo: { type: String, required: true, unique: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String, trim: true },
    parentIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    classId: { type: Schema.Types.ObjectId, ref: "Class", index: true },
    admissionDate: { type: Date },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    medicalNotes: { type: String },
    academicStatus: {
      type: String,
      enum: ["active", "probation", "dismissed", "graduated", "suspended"],
      default: "active",
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

studentProfileSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const StudentProfile = mongoose.model<IStudentProfile>(
  "StudentProfile",
  studentProfileSchema,
);
