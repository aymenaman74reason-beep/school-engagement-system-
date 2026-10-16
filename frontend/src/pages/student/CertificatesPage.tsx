import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Award, Download, ExternalLink } from "lucide-react";

export function CertificatesPage() {
  const user = useAuthStore((s) => s.user);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.id || user?._id;
    if (!id) return;
    api.get(`certificates/student/${id}`)
      .then(r => setCertificates(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const typeLabels: Record<string, string> = { completion: "Completion", merit: "Merit", participation: "Participation", excellence: "Excellence" };
  const typeColors: Record<string, string> = { completion: "bg-blue-100 text-blue-700", merit: "bg-green-100 text-green-700", excellence: "bg-amber-100 text-amber-700", participation: "bg-gray-100 text-gray-700" };

  const handleDownload = (id: string) => {
    const token = useAuthStore.getState().token;
    const baseURL = (api.defaults.baseURL || "").replace(/\/$/, "");
    window.open(`${baseURL}/certificates/${id}/download?token=${token}`, "_blank");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Award className="h-5 w-5 text-emerald-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">My Certificates</h1><p className="text-sm text-gray-500">View and download your academic certificates</p></div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div> :
      certificates.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Award className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No certificates issued yet</p>
          <p className="text-sm text-gray-400 mt-1">Certificates will appear here once awarded</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert._id} className="overflow-hidden">
              <div className={`px-4 py-2 ${typeColors[cert.type] || "bg-gray-100"}`}>
                <span className="text-sm font-semibold">{typeLabels[cert.type] || cert.type}</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">{cert.academicTermId?.name} {cert.academicTermId?.year}</p>
                    <p className="font-medium">{cert.classId?.name} {cert.classId?.section ? `- ${cert.classId.section}` : ""}</p>
                  </div>
                  <Badge variant={cert.status === "issued" ? "success" : "default"}>{cert.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {cert.metadata?.gpa != null && <div><p className="text-lg font-bold text-gray-900">{cert.metadata.gpa.toFixed(2)}</p><p className="text-xs text-gray-500">GPA</p></div>}
                  {cert.metadata?.percentage != null && <div><p className="text-lg font-bold text-gray-900">{cert.metadata.percentage.toFixed(1)}%</p><p className="text-xs text-gray-500">Score</p></div>}
                  {cert.metadata?.rank != null && <div><p className="text-lg font-bold text-gray-900">#{cert.metadata.rank}</p><p className="text-xs text-gray-500">Rank</p></div>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">#{cert.certificateNumber}</span>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(cert._id)}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
