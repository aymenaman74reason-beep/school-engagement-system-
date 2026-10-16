import React, { useEffect, useState } from "react";
import { Bell, Menu, Search, MessageSquare } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useChildContext } from "../../context/ChildContext";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const [msgRes, notifRes] = await Promise.all([
        api.get("/messages/unread-count").catch(() => null),
        api.get("/notifications").catch(() => null),
      ]);
      
      if (msgRes?.data?.data) {
        setUnreadMessages(msgRes.data.data.unreadCount || 0);
      }
      
      if (notifRes?.data?.data) {
        // Notifications API returns unreadCount in the data object based on Controller
        setUnreadNotifications(notifRes.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  };

  const handleNotificationsClick = () => {
    if (user?.role) {
      navigate(`/${user.role}/notifications`);
    }
  };

  const handleMessagesClick = () => {
    if (user?.role) {
      navigate(`/${user.role}/communications`);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-md transition-colors"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent outline-none"
            placeholder="Search students, classes, or reports..."
            type="search"
            name="search"
          />
        </div>

        {user?.role === "parent" && (
          <div className="flex items-center px-4">
            <ChildSwitcher />
          </div>
        )}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Messages Icon - Only for roles that have a communications page */}
          {(user?.role === "teacher" || user?.role === "parent") && (
            <button
              type="button"
              onClick={handleMessagesClick}
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors"
            >
              <span className="sr-only">View messages</span>
              <MessageSquare className="h-6 w-6" aria-hidden="true" />
              {unreadMessages > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-medium text-white border-2 border-white">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </button>
          )}

          {/* Notifications Icon - Hidden for parents per requirements */}
          {user?.role !== "parent" && (
            <button
              type="button"
              onClick={handleNotificationsClick}
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-medium text-white border-2 border-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          {user && (
            <div className="hidden lg:flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
function ChildSwitcher() {
  const { children, selectedChildId, setSelectedChildId } = useChildContext();

  if (!children || children.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap hidden sm:inline">Viewing For:</span>
      <select
        value={selectedChildId || ""}
        onChange={(e) => setSelectedChildId(e.target.value)}
        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-1.5 outline-none transition-all hover:bg-white"
      >
        {children.map((child: any) => (
          <option key={child._id} value={child._id}>
            {child.firstName} {child.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}
