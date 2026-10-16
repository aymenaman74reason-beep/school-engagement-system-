import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { PencilLine, FileIcon } from "lucide-react";
import { FilePreview } from "../../components/ui/FilePreview";
import { api } from "../../services/api";

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState<any>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      const d = res.data.data?.assignments || res.data.data || [];
      setAssignments(Array.isArray(d) ? d : []);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModal) return;
    setSubmitting(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (file) {
        formData.append("file", file);
      }
      await api.post(`/assignments/${submitModal._id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubmitModal(null);
      setContent("");
      setFile(null);
      setMessage("Submission successful!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to submit");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">View and submit your assignments.</p>
      </div>

      {message && <div className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PencilLine className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No assignments</h3>
            <p className="text-sm text-gray-500">You have no assignments at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a: any) => {
            const isPastDue = new Date(a.dueDate) < new Date();
            return (
              <Card key={a._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <Badge variant={isPastDue ? "default" : "success"} className="text-[10px]">
                      {isPastDue ? "Past Due" : "Active"}
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
                  {!isPastDue && (
                    <Button variant="primary" size="sm" className="mt-4 w-full" onClick={() => { setContent(""); setFile(null); setSubmitModal(a); }}>
                      Submit Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!submitModal} onClose={() => setSubmitModal(null)} title={`Submit — ${submitModal?.title || ""}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer / Work (Optional)</label>
            <textarea
              className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none min-h-[120px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your answer or add a message..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.png,.jpg" 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setSubmitModal(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
