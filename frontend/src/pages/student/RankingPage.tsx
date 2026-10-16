import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { Trophy } from "lucide-react";

export function RankingPage() {
  const user = useAuthStore((s) => s.user);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const [termsRes, enrollRes] = await Promise.all([
          api.get("academic/academic-terms?limit=20"),
          api.get(`academic/enrollments?studentId=${user?.id || user?._id}&status=active&limit=1`),
        ]);
        setTerms(termsRes.data.data || []);
        const enr = (enrollRes.data.data || [])[0];
        setEnrollment(enr);
        if (enr) {
          const currentTerm = (termsRes.data.data || []).find((t: any) => t.isCurrent);
          if (currentTerm) setSelectedTerm(currentTerm._id);
        }
      } catch {} finally { setLoading(false); }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!enrollment || !selectedTerm) return;
    setLoading(true);
    api.get(`semesters/rankings/${enrollment.classId?._id || enrollment.classId}?academicTermId=${selectedTerm}`)
      .then(r => setRankings(r.data.data || []))
      .catch(() => setRankings([]))
      .finally(() => setLoading(false));
  }, [enrollment, selectedTerm]);

  const myId = user?.id || user?._id;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><Trophy className="h-5 w-5 text-amber-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Class Rankings</h1><p className="text-sm text-gray-500">See how you rank among your classmates</p></div>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Academic Term</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
              <option value="">Select term</option>{terms.map((t:any) => <option key={t._id} value={t._id}>{t.name} {t.year} {t.isCurrent ? "(Current)" : ""}</option>)}
            </select>
          </div>
        </div>
      </CardContent></Card>

      {/* Top 3 cards */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {rankings.slice(0, 3).map((r, i) => (
            <Card key={r.studentId} className={r.studentId === myId ? "ring-2 ring-primary-500" : ""}>
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700"}`}>
                  <span className="text-xl font-bold">#{r.rank}</span>
                </div>
                <p className="font-semibold text-gray-900">{r.studentName}</p>
                <p className="text-sm text-gray-500">{r.totalPercentage?.toFixed(1)}% · GPA {r.gpa?.toFixed(2)}</p>
                {r.studentId === myId && <Badge variant="info" className="mt-1">You</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div> :
        rankings.length === 0 ? <div className="py-12 text-center text-gray-400">No rankings available</div> :
        <Table><TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student</TableHead><TableHead>GPA</TableHead><TableHead>Percentage</TableHead><TableHead>Subjects</TableHead></TableRow></TableHeader>
        <TableBody>{rankings.map((r:any) => (
          <TableRow key={r.studentId} className={r.studentId === myId ? "bg-primary-50" : ""}>
            <TableCell><span className="font-bold text-lg">#{r.rank}</span></TableCell>
            <TableCell className="font-medium">{r.studentName} {r.studentId === myId && <Badge variant="info" className="ml-1">You</Badge>}</TableCell>
            <TableCell>{r.gpa?.toFixed(2)}</TableCell>
            <TableCell>{r.totalPercentage?.toFixed(1)}%</TableCell>
            <TableCell>{r.subjectCount}</TableCell>
          </TableRow>
        ))}</TableBody></Table>}
      </CardContent></Card>
    </div>
  );
}
