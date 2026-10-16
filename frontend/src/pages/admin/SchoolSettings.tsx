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
import { Settings } from "lucide-react";
import { api } from "../../services/api";

export function SchoolSettings() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/school-config");
      setConfig(res.data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/school-config", config);
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading settings...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          School Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure school information and system settings.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-500" />
            <CardTitle>School Information</CardTitle>
          </div>
          <CardDescription>Update your school's basic details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="School Name"
            value={config.name || ""}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
          <Input
            label="Address"
            value={config.address || ""}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={config.phone || ""}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
            />
            <Input
              label="Email"
              value={config.email || ""}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
            />
          </div>
          <Input
            label="Website"
            value={config.website || ""}
            onChange={(e) => setConfig({ ...config, website: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Academic Year"
              value={config.academicYear || ""}
              onChange={(e) =>
                setConfig({ ...config, academicYear: e.target.value })
              }
            />
            <Input
              label="Current Term"
              value={config.currentTerm || ""}
              onChange={(e) =>
                setConfig({ ...config, currentTerm: e.target.value })
              }
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={handleSave} isLoading={saving}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
