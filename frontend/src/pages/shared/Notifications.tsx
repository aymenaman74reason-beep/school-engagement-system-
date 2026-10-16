import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, MessageSquare, AlertTriangle, Megaphone } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { api } from "../../services/api";

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const d = res.data.data?.notifications || res.data.data || [];
      setNotifications(Array.isArray(d) ? d : []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "alert": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "message": return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "announcement": return <Megaphone className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your latest alerts and messages.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all as read
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-500">No notifications at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any) => (
            <Card
              key={notif._id}
              className={!notif.isRead ? "bg-primary-50/30 border-primary-100" : "bg-white"}
            >
              <CardContent className="p-4 flex gap-4 pr-12 relative cursor-pointer" onClick={() => !notif.isRead && markRead(notif._id)}>
                <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <h4 className={`text-sm ${!notif.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                    {notif.title || notif.message || "Notification"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{notif.message || notif.content || ""}</p>
                  <span className="text-xs text-gray-400 block mt-2">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                {!notif.isRead && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary-500" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
