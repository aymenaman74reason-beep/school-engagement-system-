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
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import { api } from "../../services/api";

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  phone?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subjects: [] as string[],
    classes: [] as string[],
    childrenIds: [] as string[],
  });
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [userRes, classRes, subjectRes] = await Promise.all([
        api.get("/users"),
        api.get("/academic/classes").catch(() => null),
        api.get("/academic/subjects").catch(() => ({ data: { data: [] } })),
      ]);
      const data = userRes.data.data?.users || userRes.data.data || [];
      setUsers(Array.isArray(data) ? data : []);
      
      if (classRes?.data?.data) {
        setAllClasses(classRes.data.data.classes || classRes.data.data || []);
      }
      if (subjectRes?.data?.data) {
        setAllSubjects(subjectRes.data.data.subjects || subjectRes.data.data || []);
      }
      
      const students = Array.isArray(data) ? data.filter((u: any) => u.role === "student") : [];
      setAllStudents(students);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subjects: [],
      classes: [],
      childrenIds: [],
    });
    setFormError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/auth/invite-teacher", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        subjects: formData.subjects,
        classes: formData.classes,
      });
      setIsCreateOpen(false);
      resetForm();
      fetchUsers();
      alert(`Invitation sent! Credentials emailed to ${formData.email}`);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to invite teacher");
    } finally {
      setSubmitting(false);
    }
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

      // If user is teacher, send profile data too
      if (editingUser.role === "teacher") {
        payload.profile = {
          subjects: formData.subjects,
          classes: formData.classes,
        };
      }
      
      // If user is parent, send childrenIds
      if (editingUser.role === "parent") {
        payload.profile = {
          childrenIds: formData.childrenIds,
        };
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
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    const profile = (user as any).profile;
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      subjects: profile?.subjects?.map((s: any) => s._id || s) || [],
      classes: profile?.classes?.map((c: any) => c._id || c) || [],
      childrenIds: profile?.childrenIds?.map((c: any) => c._id || c) || [],
    });
    setFormError("");
    setIsEditOpen(true);
  };

  const toggleStatus = async (user: UserData) => {
    try {
      await api.put(`/users/${user._id}/status`, {
        status: user.isActive ? "inactive" : "active",
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
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
            Manage all students, teachers, parents, and admins.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Invite Teacher
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="bg-white border text-sm border-gray-300 text-gray-900 rounded-md focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none w-full sm:w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-0 rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-400"
                >
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-400"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-500">{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize text-gray-900">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleStatus(user)}>
                      <Badge
                        variant={user.isActive ? "success" : "default"}
                        className="uppercase text-[10px] cursor-pointer"
                      >
                        {user.isActive ? "active" : "inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-gray-400 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
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
        title="Invite Teacher"
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
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {allSubjects.map((s: any) => (
                  <label key={s._id} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(s._id)}
                      onChange={(e) => {
                        const subs = e.target.checked
                          ? [...formData.subjects, s._id]
                          : formData.subjects.filter(id => id !== s._id);
                        setFormData({ ...formData, subjects: subs });
                      }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Classes</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {allClasses.map((c: any) => (
                  <label key={c._id} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.classes.includes(c._id)}
                      onChange={(e) => {
                        const cls = e.target.checked
                          ? [...formData.classes, c._id]
                          : formData.classes.filter(id => id !== c._id);
                        setFormData({ ...formData, classes: cls });
                      }}
                    />
                    {c.name} {c.section || ""}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            A secure password will be auto-generated and emailed to the teacher.
          </p>
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
        title="Edit User"
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

          {editingUser?.role === "teacher" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Subjects</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {allSubjects.map((s: any) => (
                    <label key={s._id} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(s._id)}
                        onChange={(e) => {
                          const subs = e.target.checked
                            ? [...formData.subjects, s._id]
                            : formData.subjects.filter(id => id !== s._id);
                          setFormData({ ...formData, subjects: subs });
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Classes</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {allClasses.map((c: any) => (
                    <label key={c._id} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.classes.includes(c._id)}
                        onChange={(e) => {
                          const cls = e.target.checked
                            ? [...formData.classes, c._id]
                            : formData.classes.filter(id => id !== c._id);
                          setFormData({ ...formData, classes: cls });
                        }}
                      />
                      {c.name} {c.section || ""}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {editingUser?.role === "parent" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Children (Students)</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {allStudents.map((s: any) => (
                    <label key={s._id} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.childrenIds.includes(s._id)}
                        onChange={(e) => {
                          const children = e.target.checked
                            ? [...formData.childrenIds, s._id]
                            : formData.childrenIds.filter(id => id !== s._id);
                          setFormData({ ...formData, childrenIds: children });
                        }}
                      />
                      {s.firstName} {s.lastName}
                    </label>
                  ))}
                </div>
              </div>
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
              Update User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
