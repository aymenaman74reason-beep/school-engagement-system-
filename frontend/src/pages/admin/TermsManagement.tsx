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
import { Plus, Calendar, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

export function TermsManagement() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    year: new Date().getFullYear(),
    type: "semester",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/academic/academic-terms");
      const d = res.data.data?.terms || res.data.data || [];
      setTerms(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (isEditMode && editingTermId) {
        await api.put(`/academic/academic-terms/${editingTermId}`, form);
      } else {
        await api.post("/academic/academic-terms", form);
      }
      setIsModalOpen(false);
      resetForm();
      fetchTerms();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save term");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingTermId(null);
    setForm({
      name: "",
      year: new Date().getFullYear(),
      type: "semester",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
  };

  const openEdit = (t: any) => {
    setIsEditMode(true);
    setEditingTermId(t._id);
    setForm({
      name: t.name,
      year: t.year,
      type: t.type,
      startDate: t.startDate ? new Date(t.startDate).toISOString().split("T")[0] : "",
      endDate: t.endDate ? new Date(t.endDate).toISOString().split("T")[0] : "",
      isCurrent: t.isCurrent || false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this term?")) return;
    try {
      await api.delete(`/academic/academic-terms/${id}`);
      fetchTerms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete term");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Academic Terms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage semesters, trimesters, and set the current active term.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setFormError("");
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Term
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            <CardTitle>All Terms</CardTitle>
          </div>
          <CardDescription>
            List of all academic terms across years.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-400"
                  >
                    Loading terms...
                  </TableCell>
                </TableRow>
              ) : terms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-400"
                  >
                    No academic terms found.
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((t: any) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {t.name}
                        {t.isCurrent && (
                          <Badge variant="success" className="text-[10px] uppercase">Current</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{t.year}</TableCell>
                    <TableCell className="capitalize">{t.type}</TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {t.isCurrent ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Academic Term" : "Add New Academic Term"}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <Input
            label="Term Name"
            placeholder="e.g. Spring 2026"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Year"
              type="number"
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="semester">Semester</option>
                <option value="trimester">Trimester</option>
                <option value="quarter">Quarter</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="isCurrent"
              className="h-4 w-4 text-primary-600 rounded border-gray-300"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
              Set as Current Active Term
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {isEditMode ? "Update Term" : "Create Term"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
