import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { Clock, User } from "lucide-react";
import { api } from "../../services/api";
import { useChildContext } from "../../context/ChildContext";

export function ParentAttendancePage() {
  const { selectedChild, selectedChildId } = useChildContext();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChildId) fetchAttendance(selectedChildId);
  }, [selectedChildId]);

  const fetchAttendance = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/student/${studentId}`);
      const d = res.data.data?.records || res.data.data || [];
      setRecords(Array.isArray(d) ? d : []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed history of attendance for your child.</p>
        </div>
        {selectedChild && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
               <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 leading-none">Student</p>
              <p className="text-sm font-semibold text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</p>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            <CardTitle>History</CardTitle>
          </div>
          <CardDescription>
            Showing all records for {selectedChild?.firstName}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-400">No attendance records found.</TableCell></TableRow>
              ) : records.map((r: any, i: number) => (
                <TableRow key={r._id || i}>
                  <TableCell className="font-semibold text-gray-900">{r.date ? new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      r.status === "present" ? "bg-green-100 text-green-700" :
                      r.status === "absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{r.status}</span>
                  </TableCell>
                  <TableCell className="text-gray-500">{r.remarks || "No remarks"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
