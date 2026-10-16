import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import {
  Users,
  BookOpen,
  FileText,
  Settings,
  Bell,
  GraduationCap,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalUsers: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        api.get("/users").catch(() => null),
        api.get("/audit-logs?limit=5").catch(() => null),
      ]);

      if (usersRes?.data?.data) {
        const users = usersRes.data.data.users || usersRes.data.data || [];
        const list = Array.isArray(users) ? users : [];
        setStats({
          totalStudents: list.filter((u: any) => u.role === "student").length,
          totalTeachers: list.filter((u: any) => u.role === "teacher").length,
          totalParents: list.filter((u: any) => u.role === "parent").length,
          totalUsers: list.length,
        });
      }

      if (logsRes?.data?.data) {
        const logs = logsRes.data.data.logs || logsRes.data.data || [];
        setRecentLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: <GraduationCap className="h-4 w-4 text-primary-500" />,
    },
    {
      label: "Active Teachers",
      value: stats.totalTeachers,
      icon: <BookOpen className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Parents",
      value: stats.totalParents,
      icon: <Users className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="h-4 w-4 text-purple-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.firstName}. Here's your school overview.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.label}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50">
            <CardTitle>School Composition</CardTitle>
            <CardDescription>User distribution across roles</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="space-y-6">
                <div className="flex items-end justify-between">
                   <div className="space-y-1">
                      <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active Users</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+12%</p>
                      <p className="text-[10px] text-gray-400">from last month</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                   {[
                     { label: "Students", count: stats.totalStudents, color: "bg-primary-500", pct: (stats.totalStudents / stats.totalUsers) * 100 },
                     { label: "Teachers", count: stats.totalTeachers, color: "bg-blue-500", pct: (stats.totalTeachers / stats.totalUsers) * 100 },
                     { label: "Parents", count: stats.totalParents, color: "bg-green-500", pct: (stats.totalParents / stats.totalUsers) * 100 }
                   ].map((item, idx) => (
                     <div key={idx} className="space-y-1.5">
                       <div className="flex justify-between text-xs font-medium">
                         <span className="text-gray-600">{item.label}</span>
                         <span className="text-gray-900">{item.count}</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                           style={{ width: `${item.pct || 0}%` }}
                         />
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system audit logs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No recent activity.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log: any, i: number) => (
                  <div
                    key={log._id || i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${
                      log.action?.includes("DELETE") ? "bg-red-500" :
                      log.action?.includes("CREATE") ? "bg-green-500" :
                      "bg-primary-500"
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {log.action?.replace(/_/g, " ") || "Activity"}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {log.actorEmail?.split('@')[0]} • {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                       <Badge variant="info" className="text-[10px] uppercase">{log.actorRole}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/users"
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
              >
                <Users className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Manage Users
                </span>
              </Link>
              <Link
                to="/admin/classes"
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
              >
                <BookOpen className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Classes
                </span>
              </Link>
              <Link
                to="/admin/reports"
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
              >
                <FileText className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Reports
                </span>
              </Link>
              <Link
                to="/admin/settings"
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
              >
                <Settings className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  Settings
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
