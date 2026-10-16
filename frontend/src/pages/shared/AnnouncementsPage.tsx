import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Megaphone, AlertCircle } from "lucide-react";

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("announcements?limit=50&sortBy=createdAt&sortOrder=desc")
      .then(r => setAnnouncements(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const priorityColors: Record<string, "default" | "info" | "warning" | "danger"> = {
    low: "default", normal: "info", high: "warning", urgent: "danger",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <Megaphone className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Stay updated with school news</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No announcements at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a._id} className={a.priority === "urgent" ? "border-red-200 bg-red-50/30" : a.priority === "high" ? "border-amber-200 bg-amber-50/30" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                  <Badge variant={priorityColors[a.priority] || "default"}>{a.priority}</Badge>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.message}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span>By {a.createdBy?.firstName} {a.createdBy?.lastName}</span>
                  <span>·</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  {a.targetRole && a.targetRole !== "all" && (
                    <><span>·</span><Badge variant="default">{a.targetRole}</Badge></>
                  )}
                </div>
                {a.attachments?.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {a.attachments.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 underline">
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
