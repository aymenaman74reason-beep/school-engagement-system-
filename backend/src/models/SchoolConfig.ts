import mongoose, { Schema } from "mongoose";
import { ISchoolConfig } from "../types";

const schoolConfigSchema = new Schema<ISchoolConfig>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    logo: { type: String },
    principalName: { type: String, trim: true },
    establishedYear: { type: Number },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const SchoolConfig = mongoose.model<ISchoolConfig>(
  "SchoolConfig",
  schoolConfigSchema,
);
