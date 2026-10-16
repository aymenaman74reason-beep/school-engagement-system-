import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

export function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRole: "all",
    priority: "normal",
    targetClassId: "",
  });
  const [classes, setClasses] = useState<any[]>([]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get("announcements?limit=100");
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("academic/classes?limit=100");
      setClasses(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        targetClassId: form.targetClassId || undefined,
      };
      if (editingAnnouncement) {
        await api.put(`announcements/${editingAnnouncement._id}`, payload);
      } else {
        await api.post("announcements", payload);
      }
      setShowModal(false);
      setEditingAnnouncement(null);
      setForm({ title: "", message: "", targetRole: "all", priority: "normal", targetClassId: "" });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const openEdit = (a: any) => {
    setEditingAnnouncement(a);
    setForm({
      title: a.title,
      message: a.message,
      targetRole: a.targetRole || "all",
      priority: a.priority || "normal",
      targetClassId: a.targetClassId?._id || a.targetClassId || "",
    });
    setShowModal(true);
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, "default" | "info" | "warning" | "danger"> = {
      low: "default",
      normal: "info",
      high: "warning",
      urgent: "danger",
    };
    return <Badge variant={map[p] || "default"}>{p}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Megaphone className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500">Manage event announcements</p>
          </div>
        </div>
        <Button onClick={() => { setEditingAnnouncement(null); setForm({ title: "", message: "", targetRole: "all", priority: "normal", targetClassId: "" }); setShowModal(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p>No announcements yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="info">{a.targetRole || "all"}</Badge>
                    </TableCell>
                    <TableCell>{priorityBadge(a.priority)}</TableCell>
                    <TableCell>
                      {a.createdBy?.firstName} {a.createdBy?.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(a._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAnnouncement ? "Edit Announcement" : "New Announcement"}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="parent">Parents</option>
                <option value="teacher">Teachers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Class (optional)</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.targetClassId}
              onChange={(e) => setForm({ ...form, targetClassId: e.target.value })}
            >
              <option value="">All Classes</option>
              {classes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.section ? `- ${c.section}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAnnouncement ? "Update" : "Create"} Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
