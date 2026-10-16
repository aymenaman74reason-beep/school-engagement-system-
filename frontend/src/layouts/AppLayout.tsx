import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import type { MenuItem } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";

interface AppLayoutProps {
  role: string;
  menuItems: MenuItem[];
}

export function AppLayout({ role, menuItems }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        menuItems={menuItems}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        role={role}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
