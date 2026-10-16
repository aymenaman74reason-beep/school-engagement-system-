import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { Trophy, Award } from "lucide-react";
import { Modal } from "../../components/ui/Modal";

export function TeacherRankingsPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ studentId: "", type: "completion" });

  useEffect(() => {
    api.get("academic/academic-terms?limit=20").then(r => setTerms(r.data.data || [])).catch(() => {});
    api.get("academic/classes?limit=100").then(r => setClasses(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    api.get(`semesters/rankings/${selectedClass}?academicTermId=${selectedTerm}`)
      .then(r => setRankings(r.data.data || []))
      .catch(() => setRankings([]))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedTerm]);

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("certificates", { ...certForm, academicTermId: selectedTerm, classId: selectedClass });
      alert("Certificate generated successfully!");
      setShowCertModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate certificate");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><Trophy className="h-5 w-5 text-amber-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Class Rankings</h1><p className="text-sm text-gray-500">View and manage student rankings</p></div>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select class</option>{classes.map((c:any) => <option key={c._id} value={c._id}>{c.name} {c.section||""}</option>)}
            </select>
          </div>
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
              <option value="">Select term</option>{terms.map((t:any) => <option key={t._id} value={t._id}>{t.name} {t.year}</option>)}
            </select>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div> :
        rankings.length === 0 ? <div className="py-12 text-center text-gray-400">Select a class and term to view rankings</div> :
        <Table><TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student</TableHead><TableHead>GPA</TableHead><TableHead>Percentage</TableHead><TableHead>Subjects</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{rankings.map((r:any) => (
          <TableRow key={r.studentId}>
            <TableCell><span className="font-bold text-lg">#{r.rank}</span></TableCell>
            <TableCell className="font-medium">{r.studentName}</TableCell>
            <TableCell>{r.gpa?.toFixed(2)}</TableCell>
            <TableCell>{r.totalPercentage?.toFixed(1)}%</TableCell>
            <TableCell>{r.subjectCount}</TableCell>
            <TableCell>
              <Button size="sm" variant="ghost" onClick={() => { setCertForm({ studentId: r.studentId, type: "completion" }); setShowCertModal(true); }}>
                <Award className="h-4 w-4 mr-1" /> Certificate
              </Button>
            </TableCell>
          </TableRow>
        ))}</TableBody></Table>}
      </CardContent></Card>

      <Modal isOpen={showCertModal} onClose={() => setShowCertModal(false)} title="Issue Certificate">
        <form onSubmit={handleIssueCert} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={certForm.type} onChange={e => setCertForm({...certForm, type: e.target.value})}>
              <option value="completion">Completion</option>
              <option value="merit">Merit</option>
              <option value="excellence">Excellence</option>
              <option value="participation">Participation</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCertModal(false)}>Cancel</Button>
            <Button type="submit">Issue Certificate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
