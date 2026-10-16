import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { TrendingUp, User } from "lucide-react";
import { api } from "../../services/api";
import { useChildContext } from "../../context/ChildContext";

export function ChildProgress() {
  const { selectedChild, selectedChildId } = useChildContext();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChildId) fetchGrades(selectedChildId);
  }, [selectedChildId]);

  const fetchGrades = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/grades/student/${studentId}`);
      const d = res.data.data?.grades || res.data.data || [];
      setGrades(Array.isArray(d) ? d : []);
    } catch { setGrades([]); }
    finally { setLoading(false); }
  };

  const groupGradesByTerm = () => {
    const groups: Record<string, any[]> = {};
    grades.forEach(g => {
      const termName = g.academicTermId?.name || "Other";
      if (!groups[termName]) groups[termName] = [];
      groups[termName].push(g);
    });
    return groups;
  };

  const calculateTermAverage = (termGrades: any[]) => {
    if (termGrades.length === 0) return null;
    const percentages = termGrades
      .filter((g) => (g.maxScore || g.totalMaxScore) > 0)
      .map((g) => ((g.score || g.totalScore) / (g.maxScore || g.totalMaxScore)) * 100);
    if (percentages.length === 0) return null;
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    return Math.round(avg);
  };

  const grouped = groupGradesByTerm();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed performance report for your child.</p>
        </div>
        {selectedChild && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
               <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 leading-none">Student</p>
              <p className="text-sm font-semibold text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading academic records...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No grades available for this child yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([termName, termGrades]) => (
          <Card key={termName}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{termName}</span>
                <Badge variant="info">Average: {calculateTermAverage(termGrades)}%</Badge>
              </CardTitle>
              <CardDescription>Academic results for {termName}</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termGrades.map((g: any, i: number) => (
                    <TableRow key={g._id || i}>
                      <TableCell className="font-medium text-gray-900 border-r border-gray-50">
                        <div>
                          {g.subjectId?.name || "Multiple Subjects"}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.scores?.map((s: any, idx: number) => (
                              <span key={idx} className="inline-flex px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-500 rounded uppercase tracking-tight" title={`${s.score}/${s.maxScore}`}>
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{g.score || g.totalScore}</TableCell>
                      <TableCell>{g.maxScore || g.totalMaxScore}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${((g.score||g.totalScore)/(g.maxScore||g.totalMaxScore)) >=0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(((g.score||g.totalScore)/(g.maxScore||g.totalMaxScore)) * 100)}%
                        </span>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                           <span className="capitalize text-xs font-medium text-gray-700">{g.performanceLevel?.replace("_", " ") || "N/A"}</span>
                           <span className="text-[10px] text-gray-400 italic line-clamp-1">{g.remarks || "No remarks"}</span>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
