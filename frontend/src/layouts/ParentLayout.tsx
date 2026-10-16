import React from "react";
import { AppLayout } from "./AppLayout";
import {
  LayoutDashboard,
  Clock,
  TrendingUp,
  MessageSquare,
  Bell,
  Megaphone,
} from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/parent/dashboard",
  },
  {
    title: "Child Progress",
    icon: <TrendingUp className="w-5 h-5" />,
    path: "/parent/progress",
  },
  {
    title: "Attendance",
    icon: <Clock className="w-5 h-5" />,
    path: "/parent/attendance",
  },
  {
    title: "Communications",
    icon: <MessageSquare className="w-5 h-5" />,
    path: "/parent/communications",
  },
  {
    title: "Announcements",
    icon: <Megaphone className="w-5 h-5" />,
    path: "/parent/announcements",
  },
  {
    title: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    path: "/parent/notifications",
  },
];

import { ChildProvider } from "../context/ChildContext";

export function ParentLayout() {
  return (
    <ChildProvider>
      <AppLayout role="parent" menuItems={MENU_ITEMS} />
    </ChildProvider>
  );
}
