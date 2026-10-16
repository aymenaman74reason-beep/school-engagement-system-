import mongoose, { Schema } from "mongoose";
import { ISubject } from "../types";

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    creditHours: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subjectSchema.index({ code: 1, classId: 1 }, { unique: true });

subjectSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema);
