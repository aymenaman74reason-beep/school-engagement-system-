import mongoose, { Schema } from "mongoose";
import { IFeedback } from "../types";

const feedbackSchema = new Schema<IFeedback>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "AssignmentSubmission",
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
    grade: { type: String, trim: true },
    marks: { type: Number, min: 0 },
    type: {
      type: String,
      enum: ["assignment", "general", "behavioral", "academic"],
      default: "assignment",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

feedbackSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);
