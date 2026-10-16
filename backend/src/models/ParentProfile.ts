import mongoose, { Schema } from "mongoose";
import { IParentProfile } from "../types";

const parentProfileSchema = new Schema<IParentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    childrenIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    occupation: { type: String, trim: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
    },
    address: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

parentProfileSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const ParentProfile = mongoose.model<IParentProfile>(
  "ParentProfile",
  parentProfileSchema,
);
