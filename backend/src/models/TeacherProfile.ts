import mongoose, { Schema } from "mongoose";
import { ITeacherProfile } from "../types";

const teacherProfileSchema = new Schema<ITeacherProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    employeeId: { type: String, required: true, unique: true, trim: true },
    department: { type: String, trim: true },
    qualification: { type: String, trim: true },
    specialization: { type: String, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    dateOfJoining: { type: Date },
    experience: { type: Number, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

teacherProfileSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const TeacherProfile = mongoose.model<ITeacherProfile>(
  "TeacherProfile",
  teacherProfileSchema,
);
