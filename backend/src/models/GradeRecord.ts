import mongoose, { Schema } from "mongoose";
import { IGradeRecord } from "../types";

const gradeRecordSchema = new Schema<IGradeRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    academicTermId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
      index: true,
    },
    scores: [
      {
        name: { type: String, required: true },
        score: { type: Number, required: true, min: 0 },
        maxScore: { type: Number, required: true, min: 1 },
        weight: { type: Number, min: 0, max: 100 },
      },
    ],
    totalScore: { type: Number },
    maxTotalScore: { type: Number },
    percentage: { type: Number },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },
    performanceLevel: {
      type: String,
      enum: [
        "excellent",
        "very_good",
        "good",
        "satisfactory",
        "needs_improvement",
        "poor",
      ],
      trim: true,
    },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    passFail: {
      type: String,
      enum: ["pass", "fail"],
    },
    passThreshold: { type: Number, default: 50, min: 0, max: 100 },
  },
  { timestamps: true },
);

gradeRecordSchema.index(
  { studentId: 1, subjectId: 1, classId: 1, academicTermId: 1 },
  { unique: true },
);

gradeRecordSchema.pre("save", function (next) {
  if (this.scores && this.scores.length > 0) {
    this.totalScore = this.scores.reduce((sum, s) => sum + s.score, 0);
    this.maxTotalScore = this.scores.reduce((sum, s) => sum + s.maxScore, 0);
    this.percentage =
      this.maxTotalScore > 0
        ? Math.round((this.totalScore / this.maxTotalScore) * 100 * 100) / 100
        : 0;

    // Auto-set performance level if not explicitly provided
    if (!this.performanceLevel && this.percentage !== undefined) {
      if (this.percentage >= 90) this.performanceLevel = "excellent";
      else if (this.percentage >= 80) this.performanceLevel = "very_good";
      else if (this.percentage >= 70) this.performanceLevel = "good";
      else if (this.percentage >= 60) this.performanceLevel = "satisfactory";
      else if (this.percentage >= 50) this.performanceLevel = "needs_improvement";
      else this.performanceLevel = "poor";
    }

    // Auto-compute pass/fail from threshold
    const threshold = this.passThreshold ?? 50;
    this.passFail = this.percentage >= threshold ? "pass" : "fail";
  }
  next();
});

export const GradeRecord = mongoose.model<IGradeRecord>(
  "GradeRecord",
  gradeRecordSchema,
);
