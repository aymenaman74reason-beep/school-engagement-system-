import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";

export interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role: string;
}

export function Sidebar({ menuItems, isOpen, setIsOpen, role }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
          <div className="h-9 w-9 rounded-lg bg-primary-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-gray-900">
              School MS
            </span>
            <span className="text-[10px] text-gray-400 -mt-0.5 uppercase tracking-wider">
              Management System
            </span>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 flex items-center shrink-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
            {user?.firstName?.charAt(0) || role.charAt(0).toUpperCase()}
            {user?.lastName?.charAt(0) || ""}
          </div>
          <div className="ml-3 flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {user ? `${user.firstName} ${user.lastName}` : `${role} Account`}
            </span>
            <span className="text-xs text-gray-400 capitalize">{role}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 mt-auto space-y-0.5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
