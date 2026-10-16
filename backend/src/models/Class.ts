import mongoose, { Schema } from "mongoose";
import { IClass } from "../types";

const classSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      index: true,
    },
    academicYear: { type: String, trim: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    capacity: { type: Number, min: 1 },
    maxStudents: { type: Number, min: 1 },
    room: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

classSchema.virtual("subjects", {
  ref: "Subject",
  localField: "_id",
  foreignField: "classId",
});

classSchema.index({ name: 1, section: 1 }, { unique: true, sparse: true });

classSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Class = mongoose.model<IClass>("Class", classSchema);
