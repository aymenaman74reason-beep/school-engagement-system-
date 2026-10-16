import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../services/api";

export function ParentCommunicationsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ receiverId: "", subject: "", content: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [msgRes, annRes] = await Promise.all([
        api.get("/messages/threads").catch(() => null),
        api.get("/announcements").catch(() => null),
      ]);
      if (msgRes?.data?.data) {
        const d = msgRes.data.data.threads || msgRes.data.data || [];
        setMessages(Array.isArray(d) ? d : []);
      }
      if (annRes?.data?.data) {
        const d = annRes.data.data.announcements || annRes.data.data || [];
        setAnnouncements(Array.isArray(d) ? d : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (threadId: string) => {
    const thread = messages.find(m => m._id === threadId);
    if (thread && thread.unreadCount > 0) {
      try {
        await api.put(`/messages/${thread.lastMessage._id}/read`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/users/teachers/messaging");
      const d = res.data.data || [];
      setUsers(d);
    } catch { setUsers([]); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/messages", form);
      setIsMessageOpen(false);
      setForm({ receiverId: "", subject: "", content: "" });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to send");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Communications</h1>
          <p className="text-sm text-gray-500 mt-1">Messages and school announcements.</p>
        </div>
        <Button variant="primary" onClick={() => { setFormError(""); fetchTeachers(); setIsMessageOpen(true); }}>
          <Send className="mr-2 h-4 w-4" /> Message Teacher
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <CardTitle>Messages</CardTitle>
            </div>
            <CardDescription>
              {messages.length} conversations • {messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0)} unread
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m: any, i: number) => (
                  <div 
                    key={m._id || i} 
                    className={`p-3 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${m.unreadCount > 0 ? "border-primary-100 bg-primary-50/30" : "border-gray-100 bg-white"}`}
                    onClick={() => m.unreadCount > 0 && handleMarkRead(m._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded uppercase">
                            {m.otherParty?.role || "System"}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {m.otherParty ? `${m.otherParty.firstName} ${m.otherParty.lastName}` : "System Notification"}
                          </span>
                        </div>
                        <h4 className={`text-sm ${m.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {m.lastMessage?.subject || "No subject"}
                        </h4>
                      </div>
                      {m.unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                          {m.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {m.lastMessage?.content || ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {m.lastMessage?.createdAt ? new Date(m.lastMessage.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No announcements.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a: any) => (
                  <div key={a._id} className="p-3 border border-gray-100 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title="Message Teacher">
        <form onSubmit={handleSend} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <select 
              className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" 
              required 
              value={form.receiverId} 
              onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
            >
              <option value="">Select teacher</option>
              {users.map((tp: any) => (
                <option key={tp.userId?._id || tp._id} value={tp.userId?._id || tp._id}>
                  {tp.userId?.firstName || "Unknown"} {tp.userId?.lastName || "Teacher"} 
                  {tp.subjects?.length > 0 ? ` (${tp.subjects.map((s: any) => s.name).join(", ")})` : ""}
                </option>
              ))}
            </select>
          </div>
          <Input label="Subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none min-h-[100px]" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Send</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
