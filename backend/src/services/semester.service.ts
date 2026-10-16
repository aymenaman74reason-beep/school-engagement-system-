import {
  GradeRecord,
  SemesterRecord,
  Enrollment,
  StudentProfile,
  AcademicTerm,
} from "../models";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

/**
 * Compute semester GPA for a student in a given term.
 * GPA scale: percentage mapped to 4.0 scale.
 */
export const computeSemesterGPA = async (
  studentId: string,
  academicTermId: string,
): Promise<{ gpa: number; totalPercentage: number; subjectCount: number }> => {
  const grades = await GradeRecord.find({
    studentId,
    academicTermId,
    isPublished: true,
  });

  if (grades.length === 0) {
    return { gpa: 0, totalPercentage: 0, subjectCount: 0 };
  }

  const totalPercentage =
    grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length;

  // Map percentage to 4.0 GPA scale
  let gpa = 0;
  if (totalPercentage >= 90) gpa = 4.0;
  else if (totalPercentage >= 85) gpa = 3.7;
  else if (totalPercentage >= 80) gpa = 3.3;
  else if (totalPercentage >= 75) gpa = 3.0;
  else if (totalPercentage >= 70) gpa = 2.7;
  else if (totalPercentage >= 65) gpa = 2.3;
  else if (totalPercentage >= 60) gpa = 2.0;
  else if (totalPercentage >= 55) gpa = 1.7;
  else if (totalPercentage >= 50) gpa = 1.3;
  else if (totalPercentage >= 45) gpa = 1.0;
  else gpa = 0.0;

  return {
    gpa: Math.round(gpa * 100) / 100,
    totalPercentage: Math.round(totalPercentage * 100) / 100,
    subjectCount: grades.length,
  };
};

/**
 * Compute rankings for all students in a class for a given term.
 * Returns ranked list sorted by totalPercentage (descending).
 * Ties are handled with same rank (dense ranking).
 */
export const computeClassRanking = async (
  classId: string,
  academicTermId: string,
): Promise<
  {
    studentId: string;
    gpa: number;
    totalPercentage: number;
    rank: number;
    subjectCount: number;
  }[]
> => {
  // Get all enrolled students in this class for this term
  const enrollments = await Enrollment.find({
    classId,
    academicTermId,
    status: "active",
  });

  const rankings: {
    studentId: string;
    gpa: number;
    totalPercentage: number;
    rank: number;
    subjectCount: number;
  }[] = [];

  for (const enrollment of enrollments) {
    const result = await computeSemesterGPA(
      enrollment.studentId.toString(),
      academicTermId,
    );
    if (result.subjectCount > 0) {
      rankings.push({
        studentId: enrollment.studentId.toString(),
        ...result,
        rank: 0, // will be set below
      });
    }
  }

  // Sort by totalPercentage descending
  rankings.sort((a, b) => b.totalPercentage - a.totalPercentage);

  // Dense ranking with tie handling
  let currentRank = 1;
  for (let i = 0; i < rankings.length; i++) {
    if (
      i > 0 &&
      rankings[i].totalPercentage === rankings[i - 1].totalPercentage
    ) {
      rankings[i].rank = rankings[i - 1].rank;
    } else {
      rankings[i].rank = currentRank;
    }
    currentRank++;
  }

  return rankings;
};

/**
 * Progress students from one term to the next.
 * Rules:
 * - GPA >= 2.0 (50%): Promoted
 * - GPA >= 1.0 but < 2.0: Probation (if first time) or Repeated (if already on probation)
 * - GPA < 1.0: Dismissed
 * - Already dismissed: skip
 */
export const progressStudents = async (
  fromTermId: string,
  toTermId: string,
  classId: string,
  promotedToClassId?: string,
): Promise<{
  promoted: number;
  probation: number;
  repeated: number;
  dismissed: number;
}> => {
  const fromTerm = await AcademicTerm.findById(fromTermId);
  const toTerm = await AcademicTerm.findById(toTermId);
  if (!fromTerm || !toTerm) {
    throw new NotFoundError("Academic term not found");
  }

  const enrollments = await Enrollment.find({
    classId,
    academicTermId: fromTermId,
    status: "active",
  });

  const result = { promoted: 0, probation: 0, repeated: 0, dismissed: 0 };

  for (const enrollment of enrollments) {
    const studentId = enrollment.studentId.toString();
    const { gpa, totalPercentage, subjectCount } = await computeSemesterGPA(
      studentId,
      fromTermId,
    );

    // Skip if no grades
    if (subjectCount === 0) continue;

    // Check previous semester status
    const previousRecord = await SemesterRecord.findOne({
      studentId,
      academicTermId: fromTermId,
    });

    let status: string;
    if (gpa >= 2.0) {
      status = "promoted";
      result.promoted++;
    } else if (gpa >= 1.0) {
      // Check if student was already on probation
      if (previousRecord && previousRecord.status === "probation") {
        status = "repeated";
        result.repeated++;
      } else {
        status = "probation";
        result.probation++;
      }
    } else {
      status = "dismissed";
      result.dismissed++;
    }

    // Compute rank
    const rankings = await computeClassRanking(classId, fromTermId);
    const studentRanking = rankings.find((r) => r.studentId === studentId);

    // Update or create semester record for the source term
    await SemesterRecord.findOneAndUpdate(
      { studentId, academicTermId: fromTermId },
      {
        studentId,
        academicTermId: fromTermId,
        classId,
        status,
        gpa,
        totalPercentage,
        rank: studentRanking?.rank,
        totalStudentsInClass: rankings.length,
        previousTermId: undefined,
        promotedToClassId:
          status === "promoted" ? promotedToClassId || classId : undefined,
      },
      { upsert: true, new: true },
    );

    // Create enrollment for next term if promoted or probation
    if (status === "promoted" || status === "probation") {
      const targetClassId = promotedToClassId || classId;
      await Enrollment.findOneAndUpdate(
        {
          studentId,
          classId: targetClassId,
          academicTermId: toTermId,
        },
        {
          studentId,
          classId: targetClassId,
          academicTermId: toTermId,
          status: "active",
          enrollmentDate: new Date(),
        },
        { upsert: true, new: true },
      );

      // Update student profile class if promoted
      if (status === "promoted" && promotedToClassId) {
        await StudentProfile.findOneAndUpdate(
          { userId: studentId },
          { classId: promotedToClassId },
        );
      }
    }

    // Update student profile academic status
    const profileStatus =
      status === "dismissed"
        ? "dismissed"
        : status === "probation"
          ? "probation"
          : "active";
    await StudentProfile.findOneAndUpdate(
      { userId: studentId },
      { academicStatus: profileStatus },
    );

    // Mark source enrollment as completed
    enrollment.status = "completed" as any;
    await enrollment.save();
  }

  logger.info(
    `Semester progression completed: ${JSON.stringify(result)} from term ${fromTermId} to ${toTermId}`,
  );
  return result;
};

/**
 * Get semester history for a student.
 */
export const getStudentSemesterHistory = async (studentId: string) => {
  return SemesterRecord.find({ studentId })
    .populate("academicTermId", "name year type startDate endDate")
    .populate("classId", "name section")
    .populate("promotedToClassId", "name section")
    .sort({ createdAt: -1 });
};
