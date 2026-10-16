import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { FileSpreadsheet } from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export function StudentGradesPage() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGrades(); }, []);

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/grades/student/${user?.id || user?._id}`);
      const d = res.data.data?.grades || res.data.data || [];
      setGrades(Array.isArray(d) ? d : []);
    } catch { setGrades([]); }
    finally { setLoading(false); }
  };

  const calculateAverages = () => {
    if (grades.length === 0) return null;
    const percentages = grades
      .filter((g) => g.maxScore > 0)
      .map((g) => (g.score / g.maxScore) * 100);
    if (percentages.length === 0) return null;
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const max = Math.max(...percentages);
    const min = Math.min(...percentages);
    return { avg: Math.round(avg), max: Math.round(max), min: Math.round(min) };
  };

  const avgs = calculateAverages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Grades</h1>
        <p className="text-sm text-gray-500 mt-1">View your academic performance.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary-500" /><CardTitle>Grade Records</CardTitle></div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Term</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : grades.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No grades available.</TableCell></TableRow>
              ) : (
                <>
                  {grades.map((g: any) => (
                    <TableRow key={g._id}>
                      <TableCell className="font-medium text-gray-900">{g.subjectId?.name || "—"}</TableCell>
                      <TableCell>{g.score}</TableCell>
                      <TableCell>{g.maxScore}</TableCell>
                      <TableCell>{g.maxScore ? `${Math.round((g.score / g.maxScore) * 100)}%` : "-"}</TableCell>
                      <TableCell className="capitalize">{g.type || "-"}</TableCell>
                      <TableCell>{g.term || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {avgs && (
                    <TableRow className="bg-gray-50/80 font-semibold italic">
                      <TableCell className="text-gray-900">Academic Summary (Overall)</TableCell>
                      <TableCell colSpan={2} className="text-right text-gray-500">Average | High | Low :</TableCell>
                      <TableCell className="text-primary-600">{avgs.avg}% | {avgs.max}% | {avgs.min}%</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
