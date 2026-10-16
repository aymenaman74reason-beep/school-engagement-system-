import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { ArrowUpDown, Play } from "lucide-react";

export function SemesterProgression() {
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ fromTermId: "", toTermId: "", classId: "", promotedToClassId: "" });
  const [filter, setFilter] = useState({ classId: "", academicTermId: "" });

  useEffect(() => {
    api.get("academic/academic-terms?limit=50").then(r => setTerms(r.data.data || [])).catch(() => {});
    api.get("academic/classes?limit=100").then(r => setClasses(r.data.data || [])).catch(() => {});
  }, []);

  const fetchRecords = async () => {
    if (!filter.classId || !filter.academicTermId) return;
    setLoading(true);
    try {
      const r = await api.get(`semesters/records?classId=${filter.classId}&academicTermId=${filter.academicTermId}&limit=200`);
      setRecords(r.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [filter.classId, filter.academicTermId]);

  const handleProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("This will progress all students in the selected class. Continue?")) return;
    try {
      const r = await api.post("semesters/progress", { ...form, promotedToClassId: form.promotedToClassId || undefined });
      setResult(r.data.data);
      fetchRecords();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const statusBadge = (s: string) => {
    const m: Record<string, any> = { active: "info", promoted: "success", repeated: "warning", probation: "warning", dismissed: "danger", graduated: "success", completed: "default" };
    return <Badge variant={m[s] || "default"}>{s}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100"><ArrowUpDown className="h-5 w-5 text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Semester Progression</h1><p className="text-sm text-gray-500">Progress students between semesters</p></div>
        </div>
        <Button onClick={() => { setShowProgress(true); setResult(null); }}><Play className="mr-2 h-4 w-4" /> Run Progression</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={filter.classId} onChange={e => setFilter({...filter, classId: e.target.value})}><option value="">Select class</option>{classes.map((c:any) => <option key={c._id} value={c._id}>{c.name} {c.section||""}</option>)}</select></div>
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Term</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={filter.academicTermId} onChange={e => setFilter({...filter, academicTermId: e.target.value})}><option value="">Select term</option>{terms.map((t:any) => <option key={t._id} value={t._id}>{t.name} {t.year}</option>)}</select></div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div> :
        records.length === 0 ? <div className="py-12 text-center text-gray-400">Select a class and term to view records</div> :
        <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>GPA</TableHead><TableHead>Percentage</TableHead><TableHead>Rank</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{records.map((r:any) => (<TableRow key={r._id}><TableCell className="font-medium">{r.studentId?.firstName} {r.studentId?.lastName}</TableCell><TableCell>{r.gpa?.toFixed(2) || "—"}</TableCell><TableCell>{r.totalPercentage?.toFixed(1) || "—"}%</TableCell><TableCell>{r.rank ? `${r.rank}/${r.totalStudentsInClass}` : "—"}</TableCell><TableCell>{statusBadge(r.status)}</TableCell></TableRow>))}</TableBody></Table>}
      </CardContent></Card>

      <Modal isOpen={showProgress} onClose={() => setShowProgress(false)} title="Run Semester Progression" className="max-w-lg">
        <form onSubmit={handleProgress} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">From Term</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.fromTermId} onChange={e => setForm({...form, fromTermId: e.target.value})} required><option value="">Select</option>{terms.map((t:any) => <option key={t._id} value={t._id}>{t.name} {t.year}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">To Term</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.toTermId} onChange={e => setForm({...form, toTermId: e.target.value})} required><option value="">Select</option>{terms.map((t:any) => <option key={t._id} value={t._id}>{t.name} {t.year}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} required><option value="">Select</option>{classes.map((c:any) => <option key={c._id} value={c._id}>{c.name} {c.section||""}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Promote To Class (optional)</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.promotedToClassId} onChange={e => setForm({...form, promotedToClassId: e.target.value})}><option value="">Same class</option>{classes.map((c:any) => <option key={c._id} value={c._id}>{c.name} {c.section||""}</option>)}</select></div>
          {result && <div className="rounded-lg bg-green-50 p-4 text-sm"><p className="font-semibold text-green-800 mb-1">Progression Complete!</p><p>Promoted: {result.promoted} | Probation: {result.probation} | Repeated: {result.repeated} | Dismissed: {result.dismissed}</p></div>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowProgress(false)}>Close</Button><Button type="submit">Run Progression</Button></div>
        </form>
      </Modal>
    </div>
  );
}
