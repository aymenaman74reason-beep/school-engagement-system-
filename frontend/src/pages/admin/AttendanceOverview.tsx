import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Clock } from "lucide-react";
import { api } from "../../services/api";

export function AttendanceOverview() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchAttendance(selectedClass);
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/academic/classes");
      const d = res.data.data?.classes || res.data.data || [];
      const list = Array.isArray(d) ? d : [];
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/class/${classId}`);
      const d = res.data.data?.records || res.data.data || [];
      setAttendance(Array.isArray(d) ? d : []);
    } catch (err) {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Attendance Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View attendance records across all classes.
          </p>
        </div>
        <select
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {classes.map((c: any) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.section ? `- ${c.section}` : ""}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            <CardTitle>Attendance Records</CardTitle>
          </div>
          <CardDescription>{attendance.length} records found</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-400"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : attendance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-400"
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((rec: any, i: number) => (
                  <TableRow key={rec._id || i}>
                    <TableCell className="font-medium text-gray-900">
                      {rec.studentId?.firstName
                        ? `${rec.studentId.firstName} ${rec.studentId.lastName}`
                        : rec.studentId || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {rec.date ? new Date(rec.date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.status === "present"
                            ? "bg-green-50 text-green-700"
                            : rec.status === "absent"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {rec.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
