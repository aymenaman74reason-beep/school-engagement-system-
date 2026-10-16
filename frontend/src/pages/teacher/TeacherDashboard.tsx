import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import { Users, FileSpreadsheet, CheckSquare, PencilLine, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Student State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    phone: "",
    grade: "",
    section: "",
    studentId: "",
    classId: "",
  });
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [inviteError, setInviteError] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, assignRes, studentRes] = await Promise.all([
        api.get("/academic/classes").catch(() => null),
        api.get("/assignments").catch(() => null),
        api.get("/users?role=student&limit=1000").catch(() => null),
      ]);
      if (classRes?.data?.data) {
        const d = classRes.data.data.classes || classRes.data.data || [];
        setClasses(Array.isArray(d) ? d : []);
      }
      if (assignRes?.data?.data) {
        const d = assignRes.data.data.assignments || assignRes.data.data || [];
        setAssignments(Array.isArray(d) ? d : []);
      }
      if (studentRes?.data?.data) {
        const d = studentRes.data.data.users || studentRes.data.data || [];
        setAllStudents(Array.isArray(d) ? d.filter((u: any) => u.role === "student") : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSubmitting(true);
    try {
      let finalInviteData: any = { ...inviteData };
      
      if (inviteData.role === "student") {
        // Find class based on grade/section
        const targetClass = classes.find(c => 
          (c.name === inviteData.grade || c.name === `Grade ${inviteData.grade}`) && 
          c.section === inviteData.section
        );
        if (!targetClass) {
          setInviteError(`Class ${inviteData.grade}${inviteData.section} does not exist. Please contact admin.`);
          setInviteSubmitting(false);
          return;
        }
        finalInviteData.classId = targetClass._id;
      }

      await api.post("/auth/invite-user", finalInviteData);
      setIsInviteOpen(false);
      setInviteData({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
        phone: "",
        grade: "",
        section: "",
        studentId: "",
        classId: "",
      });
      alert("Invitation sent successfully! Credentials emailed to the user.");
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Failed to invite student");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.firstName}. Manage your classes and students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Invite Student/Parent
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/teacher/communications")}
          >
            New Message
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/teacher/assignments")}
          >
            Create Assignment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              My Classes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : classes.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Assignments
            </CardTitle>
            <PencilLine className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : assignments.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Attendance Rate
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">—</div>
            <p className="text-xs text-gray-500 mt-1">Mark attendance to see</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Grades
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">—</div>
            <p className="text-xs text-gray-500 mt-1">Enter grades</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Classes</CardTitle>
            <CardDescription>Classes assigned to you.</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No classes assigned yet.
              </p>
            ) : (
              <div className="space-y-3">
                {classes.map((c: any) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {c.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Section {c.section || "-"} • {c.academicYear}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-600"
                      onClick={() => navigate("/teacher/attendance")}
                    >
                      Mark Attendance
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Assignments you've created.</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
                <div className="flex flex-col items-center">
                  <PencilLine className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    No assignments yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Create your first assignment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 5).map((a: any) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {a.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        Due:{" "}
                        {a.dueDate
                          ? new Date(a.dueDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Student Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Student or Parent"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {inviteError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={inviteData.firstName}
              onChange={(e) =>
                setInviteData({ ...inviteData, firstName: e.target.value })
              }
            />
            <Input
              label="Last Name"
              required
              value={inviteData.lastName}
              onChange={(e) =>
                setInviteData({ ...inviteData, lastName: e.target.value })
              }
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={inviteData.email}
            onChange={(e) =>
              setInviteData({ ...inviteData, email: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={inviteData.role}
              onChange={(e) =>
                setInviteData({ ...inviteData, role: e.target.value, classId: "", studentId: "" })
              }
              required
            >
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {inviteData.role === "student" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5" required value={inviteData.grade} onChange={(e) => setInviteData({ ...inviteData, grade: e.target.value })}>
                  <option value="">Select Grade</option>
                  {[9, 10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5" required value={inviteData.section} onChange={(e) => setInviteData({ ...inviteData, section: e.target.value })}>
                  <option value="">Select Section</option>
                  {["A", "B", "C", "D", "E"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {inviteData.role === "parent" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Student
              </label>
              <select
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none"
                value={inviteData.studentId}
                onChange={(e) => setInviteData({ ...inviteData, studentId: e.target.value })}
                required
              >
                <option value="">Select Student</option>
                {/* Grouping students by class */}
                {classes.map(cls => {
                  const classStudents = allStudents.filter(s => s.profile?.classId === cls._id || s.profile?.classId?._id === cls._id);
                  if (classStudents.length === 0) return null;
                  return (
                    <optgroup key={cls._id} label={`${cls.name} ${cls.section || ""}`}>
                      {classStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                      ))}
                    </optgroup>
                  );
                })}
                {/* Students without class */}
                {allStudents.filter(s => !s.profile?.classId).length > 0 && (
                  <optgroup label="Unassigned Students">
                    {allStudents.filter(s => !s.profile?.classId).map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}
          <Input
            label="Phone (Optional)"
            value={inviteData.phone}
            onChange={(e) =>
              setInviteData({ ...inviteData, phone: e.target.value })
            }
          />
          <p className="text-xs text-gray-500 mt-2">
            A secure password will be auto-generated and emailed to the user.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={inviteSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
