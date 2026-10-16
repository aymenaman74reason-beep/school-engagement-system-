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
import { Badge } from "../../components/ui/Badge";
import { ShieldAlert } from "lucide-react";
import { api } from "../../services/api";

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/audit-logs");
      const d = res.data.data?.logs || res.data.data || [];
      setLogs(Array.isArray(d) ? d : []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all system activity and changes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary-500" />
            <CardTitle>Activity Log</CardTitle>
          </div>
          <CardDescription>{logs.length} entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date</TableHead>
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
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-400"
                  >
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <Badge
                        variant={
                          log.action?.includes("SUCCESS") ||
                          log.action?.includes("CREATED")
                            ? "success"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {log.action?.replace(/_/g, " ") || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {log.actorEmail || "-"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {log.entity || "-"}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs font-mono">
                      {log.ipAddress || "-"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
