import React from "react";
import { AppLayout } from "./AppLayout";
import {
  LayoutDashboard,
  Clock,
  FileSpreadsheet,
  PencilLine,
  Bell,
  Trophy,
  Award,
  Megaphone,
} from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/student/dashboard",
  },
  {
    title: "My Attendance",
    icon: <Clock className="w-5 h-5" />,
    path: "/student/attendance",
  },
  {
    title: "My Grades",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    path: "/student/grades",
  },
  {
    title: "Assignments",
    icon: <PencilLine className="w-5 h-5" />,
    path: "/student/assignments",
  },
  {
    title: "Rankings",
    icon: <Trophy className="w-5 h-5" />,
    path: "/student/rankings",
  },
  {
    title: "Certificates",
    icon: <Award className="w-5 h-5" />,
    path: "/student/certificates",
  },
  {
    title: "Announcements",
    icon: <Megaphone className="w-5 h-5" />,
    path: "/student/announcements",
  },
  {
    title: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    path: "/student/notifications",
  },
];

export function StudentLayout() {
  return <AppLayout role="student" menuItems={MENU_ITEMS} />;
}
