import mongoose from "mongoose";
import {
  User,
  StudentProfile,
  ParentProfile,
  TeacherProfile,
  Class,
  Subject,
} from "../models";
import { Roles } from "../constants/roles";

/**
 * Creates the demo accounts listed in README.md ("Default Credentials").
 * Safe to run many times: existing accounts are left untouched.
 * The shared demo admin (admin@schoolms.com) is NOT created here - the
 * server creates/updates it on every startup from ADMIN_EMAIL /
 * ADMIN_PASSWORD in .env (see seedAdmin.ts).
 *
 * This script ALSO creates one personal admin account, from
 * OWNER_ADMIN_EMAIL / OWNER_ADMIN_PASSWORD in .env. Unlike the demo admin,
 * this one is created once and left alone - it is not overwritten on
 * startup, so its password stays whatever you set.
 */
export const seedDemo = async (): Promise<void> => {
  const cls =
    (await Class.findOne({ name: "Grade 1", section: "A" })) ||
    (await Class.create({ name: "Grade 1", section: "A", isActive: true }));

  const subject =
    (await Subject.findOne({ code: "ENG101", classId: cls._id })) ||
    (await Subject.create({
      name: "English",
      code: "ENG101",
      classId: cls._id,
      description: "Basic English",
    }));

  const ensureUser = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "admin" | "teacher" | "student" | "parent",
  ) => {
    const existing = await User.findOne({ email });
    if (existing) return { user: existing, created: false };
    const user = await User.create({ email, password, firstName, lastName, role });
    return { user, created: true };
  };

  // Your own personal admin account (full access - this app has no higher role)
  const ownerEmail = process.env.OWNER_ADMIN_EMAIL;
  const ownerPassword = process.env.OWNER_ADMIN_PASSWORD;
  if (ownerEmail && ownerPassword) {
    const { created } = await ensureUser(
      ownerEmail,
      ownerPassword,
      process.env.OWNER_ADMIN_FIRST_NAME || "Aymen",
      process.env.OWNER_ADMIN_LAST_NAME || "Admin",
      Roles.ADMIN,
    );
    console.log(
      created
        ? `Personal admin created: ${ownerEmail}`
        : `Personal admin already exists: ${ownerEmail}`,
    );
  } else {
    console.log(
      "OWNER_ADMIN_EMAIL / OWNER_ADMIN_PASSWORD not set in .env - skipping personal admin.",
    );
  }

  // Teachers
  const teachers = [
    ["teacher1@school.com", "Teacher", "One"],
    ["teacher2@school.com", "Teacher", "Two"],
  ] as const;
  for (const [i, [email, first, last]] of teachers.entries()) {
    const { user, created } = await ensureUser(email, "Teacher@123456", first, last, "teacher");
    if (created) {
      await TeacherProfile.create({
        userId: user._id,
        employeeId: `EMP-DEMO-${i + 1}`,
        subjects: [subject._id],
        classes: [cls._id],
      });
    }
  }

  // Students
  const students = [
    ["student1@school.com", "Student", "One"],
    ["student2@school.com", "Student", "Two"],
  ] as const;
  const studentIds: any[] = [];
  for (const [i, [email, first, last]] of students.entries()) {
    const { user, created } = await ensureUser(email, "Student@123456", first, last, "student");
    studentIds.push(user._id);
    if (created) {
      await StudentProfile.create({
        userId: user._id,
        enrollmentNo: `STU-DEMO-${i + 1}`,
        classId: cls._id,
      });
    }
  }

  // Parent (linked to both students)
  const { user: parent, created: parentCreated } = await ensureUser(
    "parent@school.com",
    "Parent@123456",
    "Demo",
    "Parent",
    "parent",
  );
  if (parentCreated) {
    await ParentProfile.create({ userId: parent._id, childrenIds: studentIds });
    await StudentProfile.updateMany(
      { userId: { $in: studentIds } },
      { $addToSet: { parentIds: parent._id } },
    );
  }

  console.log("Demo data ready (teacher1/2, student1/2, parent @school.com).");
};

// Run directly: `npm run seed`
if (require.main === module) {
  (async () => {
    const { env } = await import("../config/env");
    await mongoose.connect(env.MONGODB_URI);
    console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
    await seedDemo();
    await mongoose.disconnect();
  })().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
