import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { BookOpen, AlertCircle, Calendar, MessageSquare, ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildContext } from "../../context/ChildContext";

export function ParentDashboard() {
  const { user } = useAuthStore();
  const { selectedChild, children, setSelectedChildId } = useChildContext();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchData(); 
  }, [selectedChild]);

  const fetchData = async () => {
    try {
      const [annRes] = await Promise.all([
        api.get("/announcements").catch(() => null),
      ]);
      if (annRes?.data?.data) {
        const d = annRes.data.data.announcements || annRes.data.data || [];
        setAnnouncements(Array.isArray(d) ? d.slice(0, 3) : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user?.firstName}. Monitor your child's academic progress.</p>
        </div>
      </div>

      {selectedChild && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-xl shadow-primary-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">Active Profile</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">{selectedChild.firstName} {selectedChild.lastName}</h2>
              <div className="flex items-center gap-4 mt-3 text-primary-100/90 font-medium">
                {selectedChild.classId && (
                  <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                     <BookOpen className="h-4 w-4" />
                     {selectedChild.classId.name} • Section {selectedChild.classId.section || "A"}
                  </div>
                )}
                {selectedChild.studentId && (
                  <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                     <span className="text-xs opacity-60">ID:</span> {selectedChild.studentId}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="bg-white text-primary-900 border-none hover:bg-white/90 shadow-lg font-bold" 
                onClick={() => window.location.href='/parent/progress'}
              >
                📊 Full Term Results
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Children</CardTitle>
            <CardDescription>Select a child to view their specific data.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !children.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
            ) : children.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No children linked to your account yet. Contact the school admin.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {children.map((child: any) => {
                   const isSelected = selectedChild === child;
                   return (
                    <button 
                      key={child._id || child} 
                      onClick={() => setSelectedChildId(child._id || child)}
                      className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20' : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm">
                           <BookOpen className="h-5 w-5" />
                        </div>
                        {isSelected && <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full uppercase">Active</span>}
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-3">
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{child.classId ? `${child.classId.name} ${child.classId.section || ""}` : "No class assigned"}</p>
                    </button>
                   );
                 })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/parent/progress" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                <span className="text-sm font-medium text-gray-900">📊 View Progress</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </a>
              <a href="/parent/attendance" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                <span className="text-sm font-medium text-gray-900">📅 Attendance</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </a>
              <a href="/parent/communications" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                <span className="text-sm font-medium text-gray-900">💬 Messages</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>School-wide updates</CardDescription>
          </div>
          <Megaphone className="h-5 w-5 text-gray-400" />
        </CardHeader>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No announcements.</p>
          ) : (
            <div className="divide-y divide-gray-100 text-sm">
              {announcements.map((a: any) => (
                <div key={a._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-gray-500 mt-1 line-clamp-2">{a.message || a.content}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Megaphone } from "lucide-react";
