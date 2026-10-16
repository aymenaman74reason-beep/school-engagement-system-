import mongoose, { Schema } from "mongoose";
import { IAnnouncement } from "../types";

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetRole: {
      type: String,
      enum: ["admin", "teacher", "student", "parent", "all"],
      index: true,
    },
    targetClassId: { type: Schema.Types.ObjectId, ref: "Class", index: true },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    attachments: [{ type: String }],
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

announcementSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema,
);
