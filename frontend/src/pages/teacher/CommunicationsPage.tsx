import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { MessageSquare, Send, Megaphone, Plus } from "lucide-react";
import { api } from "../../services/api";
import { FilePreview } from "../../components/ui/FilePreview";

export function CommunicationsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<{title: string; message: string; targetRole: string; targetClassId: string; image: File | null}>({ title: "", message: "", targetRole: "all", targetClassId: "", image: null });
  const [messageForm, setMessageForm] = useState({ receiverId: "", subject: "", content: "" });
  const [classes, setClasses] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [annRes, msgRes, classRes] = await Promise.all([
        api.get("/announcements").catch(() => null),
        api.get("/messages/threads").catch(() => null),
        api.get("/academic/classes").catch(() => null),
      ]);
      if (annRes?.data?.data) {
        const d = annRes.data.data.announcements || annRes.data.data || [];
        setAnnouncements(Array.isArray(d) ? d : []);
      }
      if (msgRes?.data?.data) {
        const d = msgRes.data.data.threads || msgRes.data.data || [];
        setMessages(Array.isArray(d) ? d : []);
      }
      if (classRes?.data?.data) {
        const d = classRes.data.data.classes || classRes.data.data || [];
        setClasses(Array.isArray(d) ? d : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (threadId: string) => {
    // For simplicity, we just mark the last message as read if it's unread
    // In a full system, we might have a specific mark-thread-as-read endpoint
    const thread = messages.find(m => m._id === threadId);
    if (thread && thread.unreadCount > 0) {
      try {
        await api.put(`/messages/${thread.lastMessage._id}/read`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const fetchUsersForMessage = async () => {
    try {
      const res = await api.get("/users/parents/messaging");
      const d = res.data.data || [];
      // d is an array of ParentProfiles with populated userId
      const mapped = d.map((p: any) => ({
        _id: p.userId._id,
        firstName: p.userId.firstName,
        lastName: p.userId.lastName,
        role: "parent",
        children: p.childrenIds // Might be ids or populated
      }));
      setUsers(mapped);
    } catch { 
      // Fallback for admins or if it fails
      const res = await api.get("/users");
      const d = res.data.data?.users || res.data.data || [];
      setUsers(Array.isArray(d) ? d : []);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", announcementForm.title);
      formData.append("message", announcementForm.message);
      formData.append("targetRole", announcementForm.targetRole);
      if (announcementForm.targetClassId) {
        formData.append("targetClassId", announcementForm.targetClassId);
      }
      if (announcementForm.image) {
        formData.append("images", announcementForm.image);
      }
      
      await api.post("/announcements", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsAnnouncementOpen(false);
      setAnnouncementForm({ title: "", message: "", targetRole: "all", targetClassId: "", image: null });
      fetchData();
    } catch (err: any) { setFormError(err.response?.data?.message || err.response?.data?.error || "Failed to create announcement"); }
    finally { setSubmitting(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/messages", messageForm);
      setIsMessageOpen(false);
      setMessageForm({ receiverId: "", subject: "", content: "" });
      fetchData();
    } catch (err: any) { setFormError(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Communications</h1>
          <p className="text-sm text-gray-500 mt-1">Send announcements and messages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setFormError(""); fetchUsersForMessage(); setIsMessageOpen(true); }}>
            <Send className="mr-2 h-4 w-4" /> New Message
          </Button>
          <Button variant="primary" onClick={() => { setFormError(""); setIsAnnouncementOpen(true); }}>
            <Megaphone className="mr-2 h-4 w-4" /> Announcement
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary-500" /><CardTitle>Announcements</CardTitle></div>
            <CardDescription>{announcements.length} announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a: any) => (
                  <div key={a._id} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex flex-col">
                        <h4 className="font-medium text-gray-900 text-sm">{a.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{a.targetRole || "Everyone"}</span>
                          {a.targetClassId && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Class: {a.targetClassId.name} {a.targetClassId.section || ""}</span>
                          )}
                        </div>
                      </div>
                    <p className="text-xs text-gray-500 mt-1">{a.message || a.content}</p>
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                        {a.attachments.map((url: string, idx: number) => (
                          <FilePreview key={idx} url={url} className="h-16 w-16" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>

      <Modal isOpen={isAnnouncementOpen} onClose={() => setIsAnnouncementOpen(false)} title="New Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
          <Input label="Title" required value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" required value={announcementForm.targetRole} onChange={(e) => setAnnouncementForm({ ...announcementForm, targetRole: e.target.value, targetClassId: "" })}>
              <option value="all">Everyone</option>
              <option value="student">Students Only</option>
              <option value="parent">Parents Only</option>
              <option value="teacher">Teachers Only</option>
            </select>
          </div>

          {(announcementForm.targetRole === "student" || announcementForm.targetRole === "parent") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Class (Optional)</label>
              <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" value={announcementForm.targetClassId} onChange={(e) => setAnnouncementForm({ ...announcementForm, targetClassId: e.target.value })}>
                <option value="">All Classes</option>
                {classes.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name} {c.section || ""}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none min-h-[100px]" required value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              onChange={(e) => setAnnouncementForm({ ...announcementForm, image: e.target.files ? e.target.files[0] : null })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAnnouncementOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Post Announcement</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title="New Message">
        <form onSubmit={handleSendMessage} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" required value={messageForm.receiverId} onChange={(e) => setMessageForm({ ...messageForm, receiverId: e.target.value })}>
              <option value="">Select recipient</option>
              {users.map((u: any) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role})</option>)}
            </select>
          </div>
          <Input label="Subject" required value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none min-h-[100px]" required value={messageForm.content} onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })} />
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
