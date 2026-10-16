import mongoose, { Schema } from "mongoose";
import { IAcademicTerm } from "../types";

const academicTermSchema = new Schema<IAcademicTerm>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false, index: true },
    year: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ["semester", "trimester", "quarter", "annual"],
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

academicTermSchema.index({ name: 1, year: 1 }, { unique: true });

academicTermSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const AcademicTerm = mongoose.model<IAcademicTerm>(
  "AcademicTerm",
  academicTermSchema,
);
