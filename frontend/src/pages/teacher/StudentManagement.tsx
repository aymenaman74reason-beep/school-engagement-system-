import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Search, Edit, User, Trash2, Plus } from "lucide-react";
import { api } from "../../services/api";

interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  status: string;
}

export function StudentManagement() {
  const [users, setUsers] = useState<StudentData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("student");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    classId: "",
  });
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, [roleFilter]);

  useEffect(() => {
    let result = users;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(s) ||
          u.lastName.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s),
      );
    }
    setFilteredUsers(result);
  }, [users, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users?role=${roleFilter}&limit=100`);
      const data = res.data.data?.users || res.data.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/academic/classes");
      setAllClasses(res.data.data?.classes || res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/auth/invite-student-parent", {
        ...formData,
        role: "student",
      });
      setIsCreateOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to invite student");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      classId: "",
    });
    setFormError("");
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      classId: user.profile?.classId?._id || user.profile?.classId || "",
    });
    setFormError("");
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError("");
    setSubmitting(true);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      if (editingUser.role === "student") {
        payload.profile = { classId: formData.classId };
      }

      await api.put(`/users/${editingUser._id}`, payload);
      setIsEditOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${roleFilter}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage student and parent details and update contact information.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {roleFilter === "student" && (
            <Button variant="primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Invite Student
            </Button>
          )}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setRoleFilter("student")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${roleFilter === "student" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Students
            </button>
            <button
              onClick={() => setRoleFilter("parent")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${roleFilter === "parent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Parents
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder={`Search ${roleFilter}s...`}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-0 rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                  Loading {roleFilter}s...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                  No {roleFilter}s found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                         <User className="h-4 w-4" />
                      </div>
                      {u.firstName} {u.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{u.email}</TableCell>
                  <TableCell className="text-gray-500">{u.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-gray-400 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Invite Student"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              required
            >
              <option value="">Select Class (Grade + Section)</option>
              {allClasses.map(c => (
                <option key={c._id} value={c._id}>{c.name} {c.section || ""}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${roleFilter === "student" ? "Student" : "Parent"} Details`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          {roleFilter === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Update Class</label>
              <select
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Select Class (Grade + Section)</option>
                {allClasses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.section || ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Update Details
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
