import mongoose, { Schema } from "mongoose";
import { IReport } from "../types";

const reportSchema = new Schema<IReport>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "attendance",
        "grade",
        "student_performance",
        "class_performance",
        "user_summary",
        "custom",
      ],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    data: { type: Schema.Types.Mixed },
    filePath: { type: String },
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    format: {
      type: String,
      enum: ["json", "csv", "pdf"],
      default: "json",
    },
  },
  { timestamps: true },
);

export const Report = mongoose.model<IReport>("Report", reportSchema);
