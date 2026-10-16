import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Plus, BookOpen, Layers, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { GRADES, SECTIONS } from "../../constants/school";

export function ClassesManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  // Subjects are now populated in the class objects
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [classForm, setClassForm] = useState({
    name: "",
    section: "",
    academicYear: new Date().getFullYear().toString(),
    maxStudents: "40",
  });
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
    classId: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/academic/classes").catch(() => null);
      if (res?.data?.data) {
        const d = res.data.data.classes || res.data.data || [];
        setClasses(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleClassExpansion = (classId: string) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
  };

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (isEditMode && editingClassId) {
        await api.put(`/academic/classes/${editingClassId}`, {
          ...classForm,
          maxStudents: Number(classForm.maxStudents),
        });
      } else {
        await api.post("/academic/classes", {
          ...classForm,
          maxStudents: Number(classForm.maxStudents),
        });
      }
      setIsClassModalOpen(false);
      resetClassForm();
      fetchClasses();
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} class`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetClassForm = () => {
    setIsEditMode(false);
    setEditingClassId(null);
    setClassForm({
      name: "",
      section: "",
      academicYear: new Date().getFullYear().toString(),
      maxStudents: "40",
    });
  };

  const openEditClass = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingClassId(c._id);
    setClassForm({
      name: c.name,
      section: c.section || "",
      academicYear: c.academicYear,
      maxStudents: c.maxStudents?.toString() || "40",
    });
    setFormError("");
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this class? This will not delete the subjects but they will be unlinked.")) return;
    try {
      await api.delete(`/academic/classes/${id}`);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete class");
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/academic/subjects", subjectForm);
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: "", code: "", description: "", classId: "" });
      fetchClasses(); // Refresh everything since subjects are merged now
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create subject");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Academic Structure
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage classes, sections, and their inner subjects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setFormError("");
              setIsClassModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Class
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            <CardTitle>Classes</CardTitle>
          </div>
          <CardDescription>
            {classes.length} classes registered. Click a class to view its subjects.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Max Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-400"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-400"
                  >
                    No classes yet.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((c: any) => (
                  <React.Fragment key={c._id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleClassExpansion(c._id)}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {c.name}
                      </TableCell>
                      <TableCell>{c.section || "-"}</TableCell>
                      <TableCell>{c.academicYear}</TableCell>
                      <TableCell>{c.maxStudents || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => openEditClass(c, e)}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClass(c._id, e)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {expandedClassId === c._id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedClassId === c._id && (
                      <TableRow className="bg-gray-50 border-t-0">
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-6 border-l-4 border-l-primary-500 bg-white m-4 rounded shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-blue-500" /> Subjects for {c.name} {c.section}
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormError("");
                                  setSubjectForm({
                                    ...subjectForm,
                                    classId: c._id,
                                  });
                                  setIsSubjectModalOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Subject
                              </Button>
                            </div>
                            
                            {(!c.subjects || c.subjects.length === 0) ? (
                              <p className="text-sm text-gray-400">No subjects assigned to this class yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {c.subjects.map((sub: any) => (
                                  <div key={sub._id} className="p-3 border border-gray-200 rounded-md bg-gray-50 flex justify-between items-start">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{sub.name}</h5>
                                      <p className="text-xs text-gray-500 font-mono mt-1">{sub.code}</p>
                                    </div>
                                    <Badge variant={sub.isActive ? "success" : "default"} className="text-[9px]">
                                      {sub.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={isEditMode ? "Edit Class" : "Add New Class"}
      >
        <form onSubmit={handleCreateOrUpdateClass} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              required
            >
              <option value="">Select Grade</option>
              {GRADES.map(g => <option key={g} value={`Grade ${g}`}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={classForm.section}
              onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
              required
            >
              <option value="">Select Section</option>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Academic Year"
              required
              value={classForm.academicYear}
              onChange={(e) =>
                setClassForm({ ...classForm, academicYear: e.target.value })
              }
            />
            <Input
              label="Max Students"
              type="number"
              value={classForm.maxStudents}
              onChange={(e) =>
                setClassForm({ ...classForm, maxStudents: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {isEditMode ? "Update Class" : "Create Class"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Subject to Class"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <Input
            label="Subject Name"
            required
            placeholder="e.g. Mathematics"
            value={subjectForm.name}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, name: e.target.value })
            }
          />
          <Input
            label="Subject Code"
            required
            placeholder="e.g. MATH101"
            value={subjectForm.code}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, code: e.target.value })
            }
          />
          <Input
            label="Description"
            placeholder="Brief description"
            value={subjectForm.description}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, description: e.target.value })
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Add Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
