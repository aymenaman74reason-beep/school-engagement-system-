import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { FileSpreadsheet, CheckSquare, PencilLine, Award } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export function StudentDashboard() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [gradeRes, assignRes, annRes] = await Promise.all([
        api.get(`/grades/student/${user?.id || user?._id}`).catch(() => null),
        api.get("/assignments").catch(() => null),
        api.get("/announcements").catch(() => null),
      ]);
      if (gradeRes?.data?.data) {
        const d = gradeRes.data.data.grades || gradeRes.data.data || [];
        setGrades(Array.isArray(d) ? d : []);
      }
      if (assignRes?.data?.data) {
        const d = assignRes.data.data.assignments || assignRes.data.data || [];
        setAssignments(Array.isArray(d) ? d : []);
      }
      if (annRes?.data?.data) {
        const d = annRes.data.data.announcements || annRes.data.data || [];
        setAnnouncements(Array.isArray(d) ? d.slice(0, 3) : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const avgScore = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + ((g.score / (g.maxScore || 100)) * 100), 0) / grades.length)
    : null;

  const pendingAssignments = assignments.filter((a: any) => new Date(a.dueDate) >= new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.firstName}. Here's your academic overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
            <Award className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : avgScore ? `${avgScore}%` : "N/A"}</div>
            <p className="text-xs text-gray-500 mt-1">Across {grades.length} grades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Assignments Due</CardTitle>
            <PencilLine className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : pendingAssignments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Grades</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : grades.length}</div>
            <p className="text-xs text-gray-500 mt-1">Received this term</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest academic performance.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {grades.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No grades yet.</p>
            ) : (
              <div className="space-y-3">
                {grades.slice(0, 5).map((g: any) => (
                  <div key={g._id} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{g.subjectId?.name || "Subject"}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{g.score}/{g.maxScore || 100}</span>
                      <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        {g.maxScore ? `${Math.round((g.score / g.maxScore) * 100)}%` : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming assignments.</p>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.slice(0, 5).map((a: any) => (
                  <div key={a._id} className="group flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{a.title}</span>
                      <span className="text-xs text-gray-500 mt-0.5">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No announcements yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 text-sm">
              {announcements.map((a: any) => (
                <div key={a._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-gray-500 mt-1 line-clamp-2">{a.message || a.content}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
