import { EventEmitter } from "events";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { ParentProfile } from "../models/ParentProfile";
import { logger } from "../utils/logger";

class SchoolEventEmitter extends EventEmitter {}
export const schoolEvents = new SchoolEventEmitter();

/**
 * Event: Attendance marked — notify student and their parents.
 */
schoolEvents.on(
  "attendance:marked",
  async (data: {
    studentId: string;
    classId: string;
    date: string;
    status: string;
    markedBy: string;
  }) => {
    try {
      const student = await User.findById(data.studentId);
      if (!student) return;

      // Notify student
      await Notification.create({
        recipientId: data.studentId,
        senderId: data.markedBy,
        type: "attendance",
        title: "Attendance Update",
        message: `Your attendance has been marked as "${data.status}" for ${new Date(data.date).toLocaleDateString()}.`,
        metadata: data,
      });

      // Notify parents
      const parentProfile = await ParentProfile.find({
        childrenIds: data.studentId,
      });
      for (const profile of parentProfile) {
        await Notification.create({
          recipientId: profile.userId,
          senderId: data.markedBy,
          type: "attendance",
          title: "Child Attendance Update",
          message: `${student.firstName}'s attendance has been marked as "${data.status}" for ${new Date(data.date).toLocaleDateString()}.`,
          metadata: data,
        });
      }
    } catch (error) {
      logger.error("Event handler error (attendance:marked):", error);
    }
  },
);

/**
 * Event: Grade entered/updated — notify student and parents.
 */
schoolEvents.on(
  "grade:updated",
  async (data: {
    studentId: string;
    subjectId: string;
    grade: string;
    enteredBy: string;
  }) => {
    try {
      const student = await User.findById(data.studentId);
      if (!student) return;

      await Notification.create({
        recipientId: data.studentId,
        senderId: data.enteredBy,
        type: "grade",
        title: "Grade Update",
        message: `A new grade has been entered or updated for one of your subjects.`,
        metadata: data,
      });

      const parentProfile = await ParentProfile.find({
        childrenIds: data.studentId,
      });
      for (const profile of parentProfile) {
        await Notification.create({
          recipientId: profile.userId,
          senderId: data.enteredBy,
          type: "grade",
          title: "Child Grade Update",
          message: `A grade has been entered or updated for ${student.firstName}.`,
          metadata: data,
        });
      }
    } catch (error) {
      logger.error("Event handler error (grade:updated):", error);
    }
  },
);

/**
 * Event: Assignment published — notify all enrolled students.
 */
schoolEvents.on(
  "assignment:published",
  async (data: {
    assignmentId: string;
    classId: string;
    title: string;
    createdBy: string;
  }) => {
    try {
      const { Enrollment } = require("../models/Enrollment");
      const enrollments = await Enrollment.find({
        classId: data.classId,
        status: "active",
      });

      for (const enrollment of enrollments) {
        await Notification.create({
          recipientId: enrollment.studentId,
          senderId: data.createdBy,
          type: "assignment",
          title: "New Assignment",
          message: `A new assignment "${data.title}" has been published.`,
          metadata: data,
        });
      }
    } catch (error) {
      logger.error("Event handler error (assignment:published):", error);
    }
  },
);

/**
 * Event: Feedback given — notify student.
 */
schoolEvents.on(
  "feedback:created",
  async (data: {
    studentId: string;
    teacherId: string;
    assignmentTitle: string;
  }) => {
    try {
      await Notification.create({
        recipientId: data.studentId,
        senderId: data.teacherId,
        type: "feedback",
        title: "New Feedback",
        message: `You have received feedback on "${data.assignmentTitle}".`,
        metadata: data,
      });
    } catch (error) {
      logger.error("Event handler error (feedback:created):", error);
    }
  },
);
