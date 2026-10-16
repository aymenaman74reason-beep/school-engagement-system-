import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Plus, PencilLine, Eye, Upload, FileIcon } from "lucide-react";
import { api } from "../../services/api";
import { FilePreview } from "../../components/ui/FilePreview";

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submissionsModal, setSubmissionsModal] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", classId: "", subjectId: "", dueDate: "", totalPoints: "100" });
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academic/subjects?classId=${form.classId}`).then((res: any) => {
        const su = res.data.data?.subjects || res.data.data || [];
        setSubjects(Array.isArray(su) ? su : []);
      }).catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [form.classId]);

  const fetchData = async () => {
    try {
      const [assignRes, classRes] = await Promise.all([
        api.get("/assignments").catch(() => null),
        api.get("/academic/classes").catch(() => null),
      ]);
      if (assignRes?.data?.data) {
        const d = assignRes.data.data.assignments || assignRes.data.data || [];
        setAssignments(Array.isArray(d) ? d : []);
      }
      const cl = classRes?.data?.data?.classes || classRes?.data?.data || [];
      setClasses(Array.isArray(cl) ? cl : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", "published");
      Object.entries(form).forEach(([key, value]) => {
        if (key === "subjectId" && !value) return; // Skip empty subjectId
        if (key === "totalPoints") {
          formData.append("totalMarks", value);
        } else {
          formData.append(key, value);
        }
      });
      if (file) {
        formData.append("file", file);
      }

      await api.post("/assignments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setIsCreateOpen(false);
      setForm({ title: "", description: "", classId: "", subjectId: "", dueDate: "", totalPoints: "100" });
      setFile(null);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create assignment");
    } finally { setSubmitting(false); }
  };

  const viewSubmissions = async (assignment: any) => {
    setSubmissionsModal(assignment);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      const d = res.data.data?.submissions || res.data.data || [];
      setSubmissions(Array.isArray(d) ? d : []);
    } catch { setSubmissions([]); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage assignments for your classes.</p>
        </div>
        <Button variant="primary" onClick={() => { setFormError(""); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Assignment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <PencilLine className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No assignments yet</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first assignment to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a: any) => (
            <Card key={a._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <Badge variant={new Date(a.dueDate) < new Date() ? "default" : "success"} className="text-[10px]">
                    {new Date(a.dueDate) < new Date() ? "Past Due" : "Active"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{a.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}</p>
                  <p>Points: {a.totalMarks || a.totalPoints || "N/A"}</p>
                </div>
                {a.attachments && a.attachments.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {a.attachments.map((url: string, idx: number) => (
                      <FilePreview key={idx} url={url} className="h-10 w-10 border border-gray-100" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => viewSubmissions(a)}>
                    <Eye className="h-3 w-3 mr-1" /> Submissions
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(a._id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500 min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}>
                <option value="">Select class</option>
                {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name} {c.section || ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} disabled={!form.classId}>
                <option value="">{subjects.length === 0 ? (form.classId ? "No subjects found for this class" : "Select a class first") : "Select subject"}</option>
                {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Input label="Total Points" type="number" value={form.totalPoints} onChange={(e) => setForm({ ...form, totalPoints: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors text-center cursor-pointer",
                file ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400"
              )}
              onClick={() => document.getElementById("assign-file")?.click()}
            >
              <input 
                id="assign-file" 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileIcon className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700 truncate max-w-[200px]">{file.name}</span>
                  <button type="button" className="text-xs text-red-500 ml-2 underline" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Click to upload assignment prompt/file (PDF, Image)</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!submissionsModal} onClose={() => setSubmissionsModal(null)} title={`Submissions — ${submissionsModal?.title || ""}`}>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No submissions yet.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {submissions.map((s: any, i: number) => (
              <div key={s._id || i} className="p-3 border border-gray-100 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">
                  {s.studentId?.firstName ? `${s.studentId.firstName} ${s.studentId.lastName}` : "Unknown"}
                </p>
                {s.content && <p className="text-xs text-gray-500 mt-1">{s.content}</p>}
                {s.attachments && s.attachments.length > 0 && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    {s.attachments.map((url: string, idx: number) => (
                      <FilePreview key={idx} url={url} className="h-20 w-20 shadow-sm" />
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
