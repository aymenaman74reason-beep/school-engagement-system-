import React from "react";
import { AppLayout } from "./AppLayout";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  FileText,
  Settings,
  ShieldAlert,
  Bell,
  Calendar,
  Megaphone,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/admin/dashboard",
  },
  { title: "Users", icon: <Users className="w-5 h-5" />, path: "/admin/users" },
  {
    title: "Classes & Subjects",
    icon: <BookOpen className="w-5 h-5" />,
    path: "/admin/classes",
  },
  {
    title: "Attendance Overview",
    icon: <Clock className="w-5 h-5" />,
    path: "/admin/attendance",
  },
  {
    title: "Grades & Reports",
    icon: <FileText className="w-5 h-5" />,
    path: "/admin/reports",
  },
  {
    title: "Academic Terms",
    icon: <Calendar className="w-5 h-5" />,
    path: "/admin/terms",
  },
  {
    title: "Semester Progression",
    icon: <ArrowUpDown className="w-5 h-5" />,
    path: "/admin/semesters",
  },
  {
    title: "Announcements",
    icon: <Megaphone className="w-5 h-5" />,
    path: "/admin/announcements",
  },
  {
    title: "Dismissal Cases",
    icon: <AlertTriangle className="w-5 h-5" />,
    path: "/admin/dismissals",
  },
  {
    title: "School Settings",
    icon: <Settings className="w-5 h-5" />,
    path: "/admin/settings",
  },
  {
    title: "Audit Logs",
    icon: <ShieldAlert className="w-5 h-5" />,
    path: "/admin/logs",
  },
  {
    title: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    path: "/admin/notifications",
  },
];

export function AdminLayout() {
  return <AppLayout role="admin" menuItems={MENU_ITEMS} />;
}
