import React from "react";
import { AppLayout } from "./AppLayout";
import {
  LayoutDashboard,
  CheckSquare,
  PencilLine,
  FileSpreadsheet,
  MessageSquare,
  Bell,
  Users,
  Megaphone,
  Trophy,
} from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/teacher/dashboard",
  },
  {
    title: "Students",
    icon: <Users className="w-5 h-5" />,
    path: "/teacher/students",
  },
  {
    title: "Attendance",
    icon: <CheckSquare className="w-5 h-5" />,
    path: "/teacher/attendance",
  },
  {
    title: "Grades",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    path: "/teacher/grades",
  },
  {
    title: "Assignments",
    icon: <PencilLine className="w-5 h-5" />,
    path: "/teacher/assignments",
  },
  {
    title: "Rankings",
    icon: <Trophy className="w-5 h-5" />,
    path: "/teacher/rankings",
  },
  {
    title: "Communications",
    icon: <MessageSquare className="w-5 h-5" />,
    path: "/teacher/communications",
  },
  {
    title: "Announcements",
    icon: <Megaphone className="w-5 h-5" />,
    path: "/teacher/announcements",
  },
  {
    title: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    path: "/teacher/notifications",
  },
];

export function TeacherLayout() {
  return <AppLayout role="teacher" menuItems={MENU_ITEMS} />;
}
