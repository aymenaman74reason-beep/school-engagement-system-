import mongoose, { Schema } from "mongoose";
import { IDismissalCase } from "../types";

const dismissalCaseSchema = new Schema<IDismissalCase>(
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
      enum: ["academic", "discipline"],
      index: true,
    },
    reason: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "appealed",
      ],
      default: "pending",
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewHistory: [
      {
        reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: {
          type: String,
          required: true,
          enum: ["reviewed", "approved", "rejected", "appealed", "comment"],
        },
        comment: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    outcome: { type: String, trim: true },
    effectiveDate: { type: Date },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

dismissalCaseSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const DismissalCase = mongoose.model<IDismissalCase>(
  "DismissalCase",
  dismissalCaseSchema,
);
