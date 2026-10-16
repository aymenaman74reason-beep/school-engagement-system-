import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { Plus, FileSpreadsheet } from "lucide-react";
import { api } from "../../services/api";

export function GradesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [terms, setTerms] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({ studentId: "", score: "", maxScore: "100", type: "assignment", academicTermId: "", remarks: "", performanceLevel: "" });
  const [students, setStudents] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchInitial(); }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) fetchGrades();
  }, [selectedClass, selectedSubject, selectedTerm]);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass]);

  const fetchInitial = async () => {
    try {
      const [classRes, termRes] = await Promise.all([
        api.get("/academic/classes").catch(() => null),
        api.get("/academic/academic-terms").catch(() => null),
      ]);
      const cl = classRes?.data?.data?.classes || classRes?.data?.data || [];
      setClasses(Array.isArray(cl) ? cl : []);
      if (cl.length) setSelectedClass(cl[0]._id);

      const tr = termRes?.data?.data?.terms || termRes?.data?.data || [];
      const termList = Array.isArray(tr) ? tr : [];
      setTerms(termList);
      const current = termList.find(t => t.isCurrent);
      if (current) setSelectedTerm(current._id);
      else if (termList.length) setSelectedTerm(termList[0]._id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedClass) {
      api.get(`/academic/subjects?classId=${selectedClass}`).then((res: any) => {
        const su = res.data.data?.subjects || res.data.data || [];
        const uniqueSubjects = Array.isArray(su) ? su : [];
        // Optional: Filter for true uniqueness if DB has duplicates
        const filtered = uniqueSubjects.filter((v, i, a) => a.findIndex(t => (t.code === v.code)) === i);
        setSubjects(filtered);
        if (filtered.length > 0) setSelectedSubject(filtered[0]._id);
        else setSelectedSubject("");
      }).catch(() => { setSubjects([]); setSelectedSubject(""); });
    } else {
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClass]);

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/grades/class/${selectedClass}/subject/${selectedSubject}?academicTermId=${selectedTerm}`);
      const d = res.data.data?.grades || res.data.data || [];
      setGrades(Array.isArray(d) ? d : []);
    } catch (err) { setGrades([]); }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/academic/enrollments?classId=${selectedClass}`);
      const d = res.data.data?.enrollments || res.data.data || [];
      const list = Array.isArray(d) ? d : [];
      setStudents(list.map((e: any) => ({
        _id: e.studentId?._id || e.studentId,
        name: e.studentId?.firstName ? `${e.studentId.firstName} ${e.studentId.lastName}` : "Unknown",
      })));
    } catch { setStudents([]); }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedClass) {
      setFormError("Please select a Class from the top menu.");
      return;
    }
    if (!selectedSubject) {
      setFormError("Please select a Subject from the top menu.");
      return;
    }
    if (!selectedTerm) {
      setFormError("Please select a Term from the top menu.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/grades", {
        studentId: gradeForm.studentId,
        classId: selectedClass,
        subjectId: selectedSubject,
        academicTermId: selectedTerm,
        scores: [{
          name: gradeForm.type.toUpperCase(),
          score: Math.max(0, Number(gradeForm.score)),
          maxScore: Math.max(1, Number(gradeForm.maxScore)),
        }],
        remarks: gradeForm.remarks,
        performanceLevel: gradeForm.performanceLevel || undefined,
      });
      setIsModalOpen(false);
      setGradeForm({ studentId: "", score: "", maxScore: "100", type: "assignment", academicTermId: "", remarks: "", performanceLevel: "" });
      fetchGrades();
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors 
        ? err.response.data.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') 
        : err.response?.data?.message || "Failed to add grade";
      setFormError(errorMsg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Grades</h1>
          <p className="text-sm text-gray-500 mt-1">Enter and manage student grades.</p>
        </div>
        <Button variant="primary" onClick={() => { setFormError(""); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Grade
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
        <span className="text-sm font-medium text-gray-500 ml-2">Class:</span>
        <select className="bg-white border border-gray-300 text-sm rounded-md p-2 outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name} {c.section || ""}</option>)}
        </select>
        <span className="text-sm font-medium text-gray-500 ml-2">Subject:</span>
        <select className="bg-white border border-gray-300 text-sm rounded-md p-2 outline-none" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          <option value="">Select subject</option>
          {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
        </select>
        <span className="text-sm font-medium text-gray-500 ml-2">Term:</span>
        <select className="bg-white border border-gray-300 text-sm rounded-md p-2 outline-none" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
          {terms.map((t: any) => <option key={t._id} value={t._id}>{t.name} ({t.year})</option>)}
        </select>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary-500" />
                <CardTitle>Grade Records</CardTitle>
              </div>
              <CardDescription>{grades.length} grades entered</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Breakdown</TableHead>
                    <TableHead>Total %</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No grades found for this class/subject.
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((g: any) => (
                      <TableRow key={g._id}>
                        <TableCell className="font-medium text-gray-900">
                          {g.studentId?.firstName ? `${g.studentId.firstName} ${g.studentId.lastName}` : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                             {g.scores?.map((s: any, idx: number) => (
                               <span key={idx} className="inline-flex flex-col px-2 py-1 bg-gray-50 border rounded text-[10px]">
                                 <span className="font-bold uppercase text-gray-400">{s.name}</span>
                                 <span>{s.score}/{s.maxScore}</span>
                               </span>
                             ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${g.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {g.percentage || 0}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {g.performanceLevel ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              g.performanceLevel === "excellent" ? "bg-green-100 text-green-700" :
                              g.performanceLevel === "very_good" ? "bg-blue-100 text-blue-700" :
                              g.performanceLevel === "good" ? "bg-teal-100 text-teal-700" :
                              g.performanceLevel === "satisfactory" ? "bg-yellow-100 text-yellow-700" :
                              g.performanceLevel === "needs_improvement" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {g.performanceLevel.replace("_", " ")}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-gray-500 text-xs italic">
                          {g.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Class Summary</CardTitle>
              <CardDescription>Overall performance for this subject</CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data to summarize</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <span className="text-sm font-medium text-primary-700">Class Average</span>
                    <span className="text-xl font-bold text-primary-900">
                      {Math.round(
                        (grades.reduce(
                          (acc, g) => acc + (g.score / g.maxScore) * 100,
                          0
                        ) /
                          grades.length) || 0
                      )}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-700">Highest Score</span>
                    <span className="text-xl font-bold text-green-900">
                      {Math.max(...grades.map((g) => Math.round((g.score / g.maxScore) * 100)))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-700">Lowest Score</span>
                    <span className="text-xl font-bold text-orange-900">
                      {Math.min(...grades.map((g) => Math.round((g.score / g.maxScore) * 100)))}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium"
                onClick={() => window.print()}
              >
                <Plus className="mr-2 h-4 w-4" /> Export Grade Sheet (PDF)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium text-blue-600 border-blue-100 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" /> Bulk Notify Parents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Grade">
        <form onSubmit={handleAddGrade} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" required value={gradeForm.studentId} onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}>
              <option value="">Select student</option>
              {students.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Score" type="number" min="0" required value={gradeForm.score} onChange={(e) => {
              let val = e.target.value;
              if (Number(val) < 0) val = "0";
              const max = gradeForm.maxScore || "100";
              if (Number(val) > Number(max)) val = max;
              
              let perf = gradeForm.performanceLevel;
              if (val && !isNaN(Number(val)) && max && !isNaN(Number(max)) && Number(max) > 0) {
                const pct = (Number(val) / Number(max)) * 100;
                if (pct >= 90) perf = "excellent";
                else if (pct >= 80) perf = "very_good";
                else if (pct >= 70) perf = "good";
                else if (pct >= 60) perf = "satisfactory";
                else if (pct >= 50) perf = "needs_improvement";
                else perf = "poor";
              }
              setGradeForm({ ...gradeForm, score: val, performanceLevel: perf });
            }} />
            <Input label="Max Score" type="number" min="1" required value={gradeForm.maxScore} onChange={(e) => {
              let val = e.target.value;
              if (Number(val) < 1) val = "1";
              setGradeForm({ ...gradeForm, maxScore: val });
            }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" value={gradeForm.type} onChange={(e) => setGradeForm({ ...gradeForm, type: e.target.value })}>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">Mid-Term</option>
                <option value="final">Final Exam</option>
                <option value="participation">Participation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" value={selectedTerm} disabled>
                {terms.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance Level</label>
            <select className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none" value={gradeForm.performanceLevel} onChange={(e) => setGradeForm({ ...gradeForm, performanceLevel: e.target.value })}>
              <option value="">Auto-calculate</option>
              <option value="excellent">Excellent</option>
              <option value="very_good">Very Good</option>
              <option value="good">Good</option>
              <option value="satisfactory">Satisfactory</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea className="w-full bg-white border border-gray-300 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500 min-h-[60px]" placeholder="Add feedback or remarks..." value={gradeForm.remarks} onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Add Grade</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
