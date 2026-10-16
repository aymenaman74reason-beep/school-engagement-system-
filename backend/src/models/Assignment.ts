import mongoose, { Schema } from "mongoose";
import { IAssignment } from "../types";

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

assignmentSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema,
);
