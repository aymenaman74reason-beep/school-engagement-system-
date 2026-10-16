import mongoose, { Schema } from "mongoose";
import { ICertificate } from "../types";

const certificateSchema = new Schema<ICertificate>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["completion", "merit", "participation", "excellence"],
    },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    issuedDate: { type: Date, default: Date.now },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "revoked"],
      default: "issued",
    },
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },
    metadata: {
      gpa: { type: Number },
      rank: { type: Number },
      totalStudents: { type: Number },
      percentage: { type: Number },
      remarks: { type: String },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

certificateSchema.index({ studentId: 1, academicTermId: 1, type: 1 });

certificateSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Certificate = mongoose.model<ICertificate>(
  "Certificate",
  certificateSchema,
);
