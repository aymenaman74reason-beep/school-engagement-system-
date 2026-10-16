import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { api } from "../../services/api";

export function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    fetchClasses();
    api.get("/academic/academic-terms").then(r => setTerms(r.data.data?.terms || r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchSubjects(selectedClass);
    }
  }, [selectedClass]);

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await api.get(`/academic/subjects?classId=${classId}`);
      const d = res.data.data?.subjects || res.data.data || [];
      const list = Array.isArray(d) ? d : [];
      setSubjects(list);
      if (list.length > 0) setSelectedSubject(list[0]._id);
      else setSelectedSubject("");
    } catch {
      setSubjects([]);
      setSelectedSubject("");
    }
  };

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

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/academic/enrollments?classId=${classId}`);
      const d = res.data.data?.enrollments || res.data.data || [];
      const enrollments = Array.isArray(d) ? d : [];
      const studentList = enrollments.map((e: any) => ({
        _id: e.studentId?._id || e.studentId,
        name: e.studentId?.firstName
          ? `${e.studentId.firstName} ${e.studentId.lastName || ""}`
          : "Unknown",
        email: e.studentId?.email || "",
      }));
      setStudents(studentList);
      const initial: Record<string, string> = {};
      studentList.forEach((s: any) => {
        initial[s._id] = "present";
      });
      setAttendance(initial);
    } catch (err) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const date = new Date().toISOString().split("T")[0];
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      
      // We need to provide academicTermId. For now, we'll fetch it or the backend handles it.
      // Assuming backend might need it, let's try to pass the one from the first class or handle it.
      const cls = classes.find(c => c._id === selectedClass);
      let termId = cls?.academicTermId?._id || cls?.academicTermId;
      if (!termId && terms.length > 0) {
        termId = terms.find(t => t.isCurrent)?._id || terms[0]._id;
      }
      
      await api.post("/attendance/bulk", { 
        classId: selectedClass,
        subjectId: selectedSubject,
        date,
        records,
        academicTermId: termId
      });
      setMessage("Attendance submitted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors 
        ? err.response.data.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') 
        : err.response?.data?.message || "Failed to submit attendance";
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClassName = classes.find((c) => c._id === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Mark Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedClassName
              ? `${selectedClassName.name} ${selectedClassName.section || ""}`
              : "Select a class"}{" "}
            •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.section || ""}
              </option>
            ))}
          </select>
          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={subjects.length === 0}
          >
            <option value="">Select Subject</option>
            {subjects.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
          >
            Submit Attendance
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Select the attendance status for each student.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-32 text-center">Present</TableHead>
                <TableHead className="w-32 text-center">Absent</TableHead>
                <TableHead className="w-32 text-center">Late</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-400"
                  >
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-400"
                  >
                    No students enrolled in this class.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium text-gray-900">
                      {student.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`status-${student._id}`}
                        checked={attendance[student._id] === "present"}
                        onChange={() =>
                          setAttendance({
                            ...attendance,
                            [student._id]: "present",
                          })
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`status-${student._id}`}
                        checked={attendance[student._id] === "absent"}
                        onChange={() =>
                          setAttendance({
                            ...attendance,
                            [student._id]: "absent",
                          })
                        }
                        className="h-4 w-4 text-red-600 focus:ring-red-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name={`status-${student._id}`}
                        checked={attendance[student._id] === "late"}
                        onChange={() =>
                          setAttendance({
                            ...attendance,
                            [student._id]: "late",
                          })
                        }
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                      />
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
