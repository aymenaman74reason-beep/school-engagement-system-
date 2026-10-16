import mongoose, { Schema } from "mongoose";
import { IAssignmentSubmission } from "../types";

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
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
    content: { type: String, required: true },
    attachments: [{ type: String }],
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "late", "graded", "returned"],
      default: "submitted",
    },
    marks: { type: Number, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

assignmentSubmissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true },
);

assignmentSubmissionSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);
