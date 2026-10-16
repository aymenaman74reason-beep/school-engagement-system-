import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { FileText, Plus, Eye } from "lucide-react";
import { api } from "../../services/api";

const REPORT_TYPES = [
  { value: "attendance", label: "Attendance Report" },
  { value: "grade", label: "Grade Report" },
  { value: "student_performance", label: "Student Performance" },
  { value: "class_performance", label: "Class Performance" },
  { value: "user_summary", label: "User Summary" },
];

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    type: "user_summary",
    format: "json",
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/reports");
      const d = res.data.data?.reports || res.data.data || [];
      setReports(Array.isArray(d) ? d : []);
    } catch (err) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/reports", formData);
      setIsGenerateOpen(false);
      setFormData({ title: "", type: "user_summary", format: "json" });
      setSuccessMsg("Report generated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchReports();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (reportId: string) => {
    setViewLoading(true);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/reports/${reportId}`);
      setViewReport(res.data.data);
    } catch (err) {
      setViewReport(null);
    } finally {
      setViewLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">{status}</Badge>;
      case "generating":
        return <Badge variant="warning">{status}</Badge>;
      case "failed":
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and view academic &amp; administrative reports.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormError("");
            setFormData({ title: "", type: "user_summary", format: "json" });
            setIsGenerateOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Generate Report
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700">
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <CardTitle>Generated Reports</CardTitle>
          </div>
          <CardDescription>{reports.length} reports available</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-400"
                  >
                    No reports generated yet. Click "Generate Report" to create
                    one.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r: any) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium text-gray-900">
                      {r.title || "Untitled"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {r.type?.replace(/_/g, " ") || "-"}
                    </TableCell>
                    <TableCell>{statusBadge(r.status || "unknown")}</TableCell>
                    <TableCell>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleViewReport(r._id)}
                        className="text-gray-400 hover:text-primary-600 p-2 rounded-md hover:bg-primary-50 transition-colors"
                        title="View Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate New Report"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {formError}
            </p>
          )}
          <Input
            label="Report Title"
            required
            placeholder="e.g. Monthly Attendance Summary"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.format}
              onChange={(e) =>
                setFormData({ ...formData, format: e.target.value })
              }
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Generate
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Report Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewReport(null);
        }}
        title={viewReport?.title || "Report Details"}
      >
        {viewLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading report...
          </div>
        ) : viewReport ? (
          <div className="space-y-4 max-w-4xl max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-gray-100">
              <div>
                <span className="text-gray-500">Type:</span>{" "}
                <span className="font-medium capitalize">
                  {viewReport.type?.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{" "}
                {statusBadge(viewReport.status)}
              </div>
              <div>
                <span className="text-gray-500">Format:</span>{" "}
                <span className="font-medium">{viewReport.format}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="font-medium">
                  {viewReport.createdAt
                    ? new Date(viewReport.createdAt).toLocaleString()
                    : "-"}
                </span>
              </div>
            </div>

            {viewReport.data && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Report Data Summary
                </h4>
                
                {/* Specific Table Renderings based on Type */}
                {viewReport.type === "user_summary" && viewReport.data.byRole && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Total Users</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewReport.data.byRole.map((role: any) => (
                        <TableRow key={role._id}>
                          <TableCell className="capitalize font-medium">{role._id}</TableCell>
                          <TableCell>{role.count}</TableCell>
                          <TableCell>{role.activeCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {(viewReport.type === "attendance" || viewReport.type === "grade") && viewReport.data.records && (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity</TableHead>
                          <TableHead>{viewReport.type === "attendance" ? "Attendance" : "Score"}</TableHead>
                          <TableHead>{viewReport.type === "attendance" ? "Total Days" : "Grade"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewReport.data.records.slice(0, 20).map((rec: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{rec.studentName || rec.subjectName}</TableCell>
                            <TableCell>
                              {viewReport.type === "attendance" 
                                ? rec.attendance?.map((a: any) => `${a.status}: ${a.count}`).join(", ") 
                                : `${rec.percentage || 0}%`}
                            </TableCell>
                            <TableCell>{rec.totalDays || rec.grade || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {viewReport.data.records.length > 20 && (
                      <p className="text-center text-[10px] text-gray-400 py-2 bg-gray-50 italic">Showing first 20 records. Download {viewReport.format.toUpperCase()} for full data.</p>
                    )}
                  </div>
                )}

                {/* Fallback to JSON for other or complex types */}
                {(!["user_summary", "attendance", "grade"].includes(viewReport.type)) && (
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-800 overflow-auto max-h-64">
                    {JSON.stringify(viewReport.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Failed to load report.
          </div>
        )}
      </Modal>
    </div>
  );
}
