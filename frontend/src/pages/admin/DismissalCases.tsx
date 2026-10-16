import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { AlertTriangle, Plus, Eye, CheckCircle, XCircle } from "lucide-react";

export function DismissalCases() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ action: "reviewed", comment: "" });
  const [resolveForm, setResolveForm] = useState({ action: "approved", outcome: "" });
  const [form, setForm] = useState({ studentId: "", type: "academic", reason: "", description: "", academicTermId: "" });

  const fetchCases = async () => { try { setLoading(true); const r = await api.get("dismissals?limit=100"); setCases(r.data.data || []); } catch {} finally { setLoading(false); } };
  const fetchStudents = async () => { try { const r = await api.get("users?role=student&limit=200"); setStudents(r.data.data?.users || []); } catch {} };
  const fetchTerms = async () => { try { const r = await api.get("academic/academic-terms?limit=50"); setTerms(r.data.data || []); } catch {} };
  useEffect(() => { fetchCases(); fetchStudents(); fetchTerms(); }, []);

  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post("dismissals", { ...form, academicTermId: form.academicTermId || undefined }); setShowCreate(false); fetchCases(); } catch (err: any) { alert(err.response?.data?.message || "Failed"); } };
  const handleReview = async () => { try { await api.put(`dismissals/${selectedCase._id}/review`, reviewForm); setReviewForm({ action: "reviewed", comment: "" }); const r = await api.get(`dismissals/${selectedCase._id}`); setSelectedCase(r.data.data); fetchCases(); } catch (err: any) { alert(err.response?.data?.message || "Failed"); } };
  const handleResolve = async (action: string) => { try { await api.put(`dismissals/${selectedCase._id}/resolve`, { action, outcome: resolveForm.outcome }); const r = await api.get(`dismissals/${selectedCase._id}`); setSelectedCase(r.data.data); fetchCases(); } catch (err: any) { alert(err.response?.data?.message || "Failed"); } };
  const openDetail = async (c: any) => { try { const r = await api.get(`dismissals/${c._id}`); setSelectedCase(r.data.data); setShowDetail(true); } catch {} };

  const sBadge = (s: string) => { const m: Record<string, any> = { pending: "warning", under_review: "info", approved: "danger", rejected: "success", appealed: "warning" }; return <Badge variant={m[s] || "default"}>{s.replace("_", " ")}</Badge>; };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Dismissal Cases</h1><p className="text-sm text-gray-500">Academic & discipline case management</p></div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> New Case</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["pending", "under_review", "approved", "rejected"].map((s) => (<Card key={s}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{cases.filter((c) => c.status === s).length}</p><p className="text-sm text-gray-500 capitalize">{s.replace("_", " ")}</p></CardContent></Card>))}
      </div>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{cases.map((c) => (<TableRow key={c._id}><TableCell className="font-medium">{c.studentId?.firstName} {c.studentId?.lastName}</TableCell><TableCell><Badge variant={c.type === "academic" ? "warning" : "danger"}>{c.type}</Badge></TableCell><TableCell className="max-w-[200px] truncate">{c.reason}</TableCell><TableCell>{sBadge(c.status)}</TableCell><TableCell className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => openDetail(c)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>)}
      </CardContent></Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Dismissal Case" className="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Student</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required><option value="">Select student</option>{students.map((s: any) => (<option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>))}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="academic">Academic</option><option value="discipline">Discipline</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Term</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.academicTermId} onChange={(e) => setForm({ ...form, academicTermId: e.target.value })}><option value="">Select term</option>{terms.map((t: any) => (<option key={t._id} value={t._id}>{t.name} {t.year}</option>))}</select></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit">Create Case</Button></div>
        </form>
      </Modal>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Case Details" className="max-w-2xl">
        {selectedCase && (<div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4"><div><span className="text-sm text-gray-500">Student:</span> <span className="font-medium">{selectedCase.studentId?.firstName} {selectedCase.studentId?.lastName}</span></div><div><span className="text-sm text-gray-500">Status:</span> {sBadge(selectedCase.status)}</div></div>
          <div><span className="text-sm text-gray-500">Reason:</span><p className="mt-1 text-sm">{selectedCase.reason}</p></div>
          {selectedCase.outcome && <div><span className="text-sm text-gray-500">Outcome:</span><p className="mt-1 text-sm font-medium">{selectedCase.outcome}</p></div>}
          <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Review History</h4>{selectedCase.reviewHistory?.map((r: any, i: number) => (<div key={i} className="rounded-lg border border-gray-100 p-3 mb-2"><div className="flex justify-between"><span className="text-sm font-medium">{r.reviewer?.firstName} {r.reviewer?.lastName}</span><span className="text-xs text-gray-400">{new Date(r.date).toLocaleString()}</span></div><Badge variant="info" className="mt-1">{r.action}</Badge>{r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}</div>))}</div>
          {selectedCase.status !== "approved" && selectedCase.status !== "rejected" && (<div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex gap-2"><select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={reviewForm.action} onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}><option value="reviewed">Reviewed</option><option value="comment">Comment</option></select><input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Comment..." value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} /><Button size="sm" onClick={handleReview}>Add</Button></div>
            <div className="flex gap-2"><input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Outcome..." value={resolveForm.outcome} onChange={(e) => setResolveForm({ ...resolveForm, outcome: e.target.value })} /><Button size="sm" variant="danger" onClick={() => handleResolve("approved")}><CheckCircle className="mr-1 h-3 w-3" />Approve</Button><Button size="sm" variant="outline" onClick={() => handleResolve("rejected")}><XCircle className="mr-1 h-3 w-3" />Reject</Button></div>
          </div>)}
        </div>)}
      </Modal>
    </div>
  );
}
