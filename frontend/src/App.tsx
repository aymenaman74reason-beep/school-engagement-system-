import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { TeacherLayout } from "./layouts/TeacherLayout";
import { StudentLayout } from "./layouts/StudentLayout";
import { ParentLayout } from "./layouts/ParentLayout";

// Auth Pages
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { Unauthorized } from "./pages/auth/Unauthorized";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { ClassesManagement } from "./pages/admin/ClassesManagement";
import { AttendanceOverview } from "./pages/admin/AttendanceOverview";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SchoolSettings } from "./pages/admin/SchoolSettings";
import { AuditLogs } from "./pages/admin/AuditLogs";
import { TermsManagement } from "./pages/admin/TermsManagement";
import { AnnouncementsManagement } from "./pages/admin/AnnouncementsManagement";
import { DismissalCases } from "./pages/admin/DismissalCases";
import { SemesterProgression } from "./pages/admin/SemesterProgression";

// Teacher Pages
import { TeacherDashboard } from "./pages/teacher/TeacherDashboard";
import { AttendancePage as TeacherAttendance } from "./pages/teacher/AttendancePage";
import { GradesPage as TeacherGrades } from "./pages/teacher/GradesPage";
import { AssignmentsPage as TeacherAssignments } from "./pages/teacher/AssignmentsPage";
import { CommunicationsPage as TeacherCommunications } from "./pages/teacher/CommunicationsPage";
import { StudentManagement as TeacherStudentManagement } from "./pages/teacher/StudentManagement";
import { TeacherRankingsPage } from "./pages/teacher/RankingsPage";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentAttendancePage } from "./pages/student/AttendancePage";
import { StudentGradesPage } from "./pages/student/GradesPage";
import { StudentAssignmentsPage } from "./pages/student/AssignmentsPage";
import { RankingPage } from "./pages/student/RankingPage";
import { CertificatesPage } from "./pages/student/CertificatesPage";

// Parent Pages
import { ParentDashboard } from "./pages/parent/ParentDashboard";
import { ChildProgress } from "./pages/parent/ChildProgress";
import { ParentAttendancePage } from "./pages/parent/AttendancePage";
import { ParentCommunicationsPage } from "./pages/parent/CommunicationsPage";

// Shared Pages
import { Notifications } from "./pages/shared/Notifications";
import { AnnouncementsPage } from "./pages/shared/AnnouncementsPage";

// Guards
import { ProtectedRoute, RoleRoute } from "./routes/ProtectedRoute";

export default function App() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="classes" element={<ClassesManagement />} />
              <Route path="attendance" element={<AttendanceOverview />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SchoolSettings />} />
              <Route path="terms" element={<TermsManagement />} />
              <Route path="logs" element={<AuditLogs />} />
              <Route path="announcements" element={<AnnouncementsManagement />} />
              <Route path="dismissals" element={<DismissalCases />} />
              <Route path="semesters" element={<SemesterProgression />} />
              <Route path="notifications" element={<Notifications />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Teacher Routes */}
          <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="grades" element={<TeacherGrades />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="students" element={<TeacherStudentManagement />} />
              <Route path="communications" element={<TeacherCommunications />} />
              <Route path="rankings" element={<TeacherRankingsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Student Routes */}
          <Route element={<RoleRoute allowedRoles={["student"]} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="attendance" element={<StudentAttendancePage />} />
              <Route path="grades" element={<StudentGradesPage />} />
              <Route path="assignments" element={<StudentAssignmentsPage />} />
              <Route path="rankings" element={<RankingPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Parent Routes */}
          <Route element={<RoleRoute allowedRoles={["parent"]} />}>
            <Route path="/parent" element={<ParentLayout />}>
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="progress" element={<ChildProgress />} />
              <Route path="attendance" element={<ParentAttendancePage />} />
              <Route path="communications" element={<ParentCommunicationsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="*"
          element={
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-gray-900">
              <div className="h-16 w-16 rounded-xl bg-primary-500 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-2xl">SM</span>
              </div>
              <h1 className="text-3xl font-bold">404</h1>
              <p className="text-gray-500 mt-2">Page Not Found</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
