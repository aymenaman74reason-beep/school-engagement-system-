import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { Clock } from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export function StudentAttendancePage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchAttendance();
    fetchStudentSubjects();
  }, [selectedSubject]);

  const fetchStudentSubjects = async () => {
    try {
      const res = await api.get("/academic/subjects"); // Filtered by teacher/student automatically in my previous change
      const d = res.data.data?.subjects || res.data.data || [];
      setSubjects(Array.isArray(d) ? d : []);
    } catch { setSubjects([]); }
  };

  const fetchAttendance = async () => {
    try {
      let url = `/attendance/student/${user?.id || user?._id}`;
      if (selectedSubject) url += `?subjectId=${selectedSubject}`;
      const res = await api.get(url);
      const d = res.data.data?.records || res.data.data || [];
      setRecords(Array.isArray(d) ? d : []);
    } catch (err) { setRecords([]); }
    finally { setLoading(false); }
  };

  const stats = {
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">View your attendance records.</p>
        </div>
        <select 
          className="bg-white border border-gray-300 text-sm rounded-lg p-2.5 outline-none w-full sm:w-48"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-sm text-gray-500 mt-1">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-sm text-gray-500 mt-1">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-sm text-gray-500 mt-1">Late</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary-500" /><CardTitle>Attendance History</CardTitle></div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No attendance records.</TableCell></TableRow>
              ) : records.map((r: any, i: number) => (
                <TableRow key={r._id || i}>
                  <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{r.subjectId?.name || "Daily"}</TableCell>
                  <TableCell>{r.classId?.name || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "present" ? "bg-green-50 text-green-700" :
                      r.status === "absent" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                    }`}>{r.status}</span>
                  </TableCell>
                  <TableCell className="text-gray-500">{r.remarks || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
