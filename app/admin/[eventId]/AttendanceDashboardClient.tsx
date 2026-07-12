"use client";

import { useState, useActionState, startTransition, useEffect } from "react";
import { updateEventSettings } from "../actions";

interface EventDetails {
  id: string;
  name: string;
  event_date: string;
  description?: string | null;
  theme_color?: string;
  background_style?: string;
  banner_url?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface AttendanceLogEntry {
  id: string;
  event_id: string;
  full_name?: string; 
  student_name?: string; 
  section: string;
  created_at: string;
}

interface RosterItem {
  id: string;
  full_name: string;
  section: string;
  has_checked_in: boolean;
}

interface AttendanceDashboardClientProps {
  event: EventDetails;
  attendanceLog: AttendanceLogEntry[];
  roster: RosterItem[];
}

export default function AttendanceDashboardClient({
  event,
  attendanceLog,
  roster,
}: AttendanceDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"present" | "absent" | "logs">("present");
  const [searchFilter, setSearchFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Optimistic UI state
  const [liveEvent, setLiveEvent] = useState<EventDetails>(event);
  const [prevEventProp, setPrevEventProp] = useState<EventDetails>(event);

  const [settingsState, settingsFormAction, isSettingsPending] = useActionState(updateEventSettings, { success: false, error: "" });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync props to state safely during render
  if (event !== prevEventProp) {
    setPrevEventProp(event);
    setLiveEvent(event);
  }

  // QR and URL logic
  const isClient = typeof window !== "undefined";
  const checkInUrl = isClient ? `${window.location.origin}/checkin/${liveEvent.id}` : "";
  const qrImageUrl = isClient && checkInUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkInUrl)}` 
    : "";

  const isClosedRosterEvent = roster && roster.length > 0;
  const presentList = isClosedRosterEvent 
    ? roster.filter((student) => student.has_checked_in)
    : attendanceLog.map((log) => ({ 
        id: log.id, 
        full_name: log.full_name || log.student_name || "Unknown", 
        section: log.section, 
        has_checked_in: true 
      }));

  const absentList = isClosedRosterEvent ? roster.filter((student) => !student.has_checked_in) : [];
  const totalRosterCount = isClosedRosterEvent ? roster.length : attendanceLog.length;
  const checkInCount = attendanceLog.length;
  const progressPercentage = isClosedRosterEvent && totalRosterCount ? Math.round((checkInCount / totalRosterCount) * 100) : 100;

  const departmentMetrics: Record<string, number> = {};
  const courseMetrics: Record<string, number> = {};

  attendanceLog.forEach((item) => {
    const rawSection = (item.section || "").toUpperCase();
    const parts = rawSection.split("-").map(p => p.trim());
    const deptKey = parts.length >= 2 ? parts[0] : (rawSection.match(/^[A-Z]+/)?.[0] || "OTHER");
    departmentMetrics[deptKey] = (departmentMetrics[deptKey] || 0) + 1;
  });

  const filteredStudents = (activeTab === "present" ? presentList : absentList).filter((s) =>
    (s.full_name || "").toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
    (s.section || "").toLowerCase().includes(searchFilter.trim().toLowerCase())
  );

  // Gate Status
  const startMs = liveEvent.start_time ? new Date(liveEvent.start_time).getTime() : 0;
  const endMs = liveEvent.end_time ? new Date(liveEvent.end_time).getTime() : Infinity;
  let gateStatus = "GATE OPEN";
  let gateColor = "bg-emerald-100 text-emerald-800 ring-emerald-700/20";
  
  if (liveEvent.start_time && currentTime < startMs) {
    gateStatus = "SCHEDULED (CLOSED)";
    gateColor = "bg-amber-100 text-amber-800 ring-amber-700/20";
  } else if (liveEvent.end_time && currentTime > endMs) {
    gateStatus = "GATE CLOSED";
    gateColor = "bg-red-100 text-red-800 ring-red-700/20";
  }

  const handleUpdateSubmission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLiveEvent(prev => ({
      ...prev,
      start_time: (data.get("start_time") as string) || null,
      end_time: (data.get("end_time") as string) || null,
    }));
    data.append("eventId", liveEvent.id);
    startTransition(() => { settingsFormAction(data); setIsEditing(false); });
  };

  const handleForceAction = (actionType: "open" | "close") => {
    if (!window.confirm(`Are you sure you want to force ${actionType} the attendance gate?`)) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localNow = now.toISOString().slice(0, 16);
    const data = new FormData();
    data.append("eventId", liveEvent.id);
    data.append("name", liveEvent.name);
    data.append("event_date", liveEvent.event_date);
    if (actionType === "open") {
      data.append("start_time", localNow);
      data.append("end_time", "");
      setLiveEvent(prev => ({ ...prev, start_time: localNow, end_time: null }));
    } else {
      data.append("start_time", liveEvent.start_time || "");
      data.append("end_time", localNow);
      setLiveEvent(prev => ({ ...prev, end_time: localNow }));
    }
    startTransition(() => { settingsFormAction(data); });
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Active Management Terminal</span>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${gateColor}`}>{gateStatus}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{liveEvent.name}</h1>
          <div className="pt-2 flex items-center gap-4">
            <a href={checkInUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 underline">Open Check-in Portal ↗</a>
            <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-medium text-slate-600 border border-slate-300 rounded-md px-2.5 py-1 bg-slate-50">
              {isEditing ? "Hide Adjustments" : "⚙ Edit Event Details & Timing"}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 h-36 w-36 flex items-center justify-center">
            {qrImageUrl && <img src={qrImageUrl} alt="QR" className="w-32 h-32" />}
          </div>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleUpdateSubmission} className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex justify-between border-b pb-3">
            <h3 className="text-sm font-bold uppercase">Live Administrative Adjustments</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleForceAction('open')} className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded">🟢 Force Open</button>
              <button type="button" onClick={() => handleForceAction('close')} className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded">🔴 Force Close</button>
            </div>
          </div>
          <input name="name" defaultValue={liveEvent.name} className="w-full rounded border px-3 py-1.5 text-sm" />
          <input type="date" name="event_date" defaultValue={liveEvent.event_date} className="w-full rounded border px-3 py-1.5 text-sm" />
          <input type="datetime-local" name="start_time" defaultValue={liveEvent.start_time?.substring(0,16) || ""} className="w-full rounded border px-3 py-1.5 text-sm" />
          <input type="datetime-local" name="end_time" defaultValue={liveEvent.end_time?.substring(0,16) || ""} className="w-full rounded border px-3 py-1.5 text-sm" />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="border px-4 py-1.5 text-sm">Cancel</button>
            <button type="submit" disabled={isSettingsPending} className="bg-indigo-600 text-white px-4 py-1.5 text-sm rounded">Save Changes</button>
          </div>
        </form>
      )}
      
      {/* Table and rest of UI stays the same... */}
    </div>
  );
}