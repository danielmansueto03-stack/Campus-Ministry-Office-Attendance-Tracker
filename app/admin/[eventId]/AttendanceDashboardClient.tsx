"use client";

import { useState, useActionState, startTransition } from "react";
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
  student_name: string;
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
  const [sectionFilter, setSectionFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Settings modification action hooks
  const [settingsState, settingsFormAction, isSettingsPending] = useActionState(updateEventSettings, { success: false, error: "" });

  // 1. CHAMELEON ROSTER LOGIC: Check if this event tracks an explicit roster or is completely open
  const isClosedRosterEvent = roster && roster.length > 0;

  // Compile present/absent states based on roster mode selection
  const presentList = isClosedRosterEvent 
    ? roster.filter((student) => student.has_checked_in)
    : attendanceLog.map((log) => ({ id: log.id, full_name: log.student_name, section: log.section, has_checked_in: true }));

  const absentList = isClosedRosterEvent ? roster.filter((student) => !student.has_checked_in) : [];
  
  const totalRosterCount = isClosedRosterEvent ? roster.length : attendanceLog.length;
  const checkInCount = attendanceLog.length;
  const progressPercentage = isClosedRosterEvent && totalRosterCount ? Math.round((checkInCount / totalRosterCount) * 100) : 100;

  // 2. DEPARTMENT STATS TRACKER: Extract and group sections (CHAP, CABECS, etc.)
  const departmentMetrics: Record<string, number> = {};
  attendanceLog.forEach((item) => {
    const rawSection = item.section.toUpperCase();
    // Regex matches alphabetic tokens like CHAP, CABECS, CAS, etc.
    const match = rawSection.match(/[A-Z]+/);
    const deptKey = match ? match[0] : "OTHER";
    departmentMetrics[deptKey] = (departmentMetrics[deptKey] || 0) + 1;
  });

  // Structural dynamic list compilation
  const targetList = activeTab === "present" ? presentList : absentList;
  const filteredStudents = targetList.filter((student) =>
    student.section.toLowerCase().includes(sectionFilter.trim().toLowerCase())
  );

  const checkInUrl = typeof window !== "undefined" ? `${window.location.origin}/checkin/${event.id}` : `/checkin/${event.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`;

  const handleUpdateSubmission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.append("eventId", event.id);
    startTransition(() => {
      settingsFormAction(data);
      setIsEditing(false);
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Top Banner Layout Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Active Management Terminal
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              isClosedRosterEvent ? "bg-blue-50 text-blue-700 ring-blue-700/10" : "bg-emerald-50 text-emerald-700 ring-emerald-700/10"
            }`}>
              {isClosedRosterEvent ? "Roster Validated Event" : "Open Attendance Event"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>
          <p className="text-slate-500">{event.description || "No descriptions configured for this timeline."}</p>
          <div className="pt-2 flex items-center gap-4">
            <a href={checkInUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline">
              Open Check-in Portal ↗
            </a>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-2.5 py-1 bg-slate-50"
            >
              {isEditing ? "Hide Adjustments" : "⚙ Edit Event Details & Timing"}
            </button>
          </div>
        </div>

        {/* QR Box */}
        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 text-center shrink-0">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner">
            <img src={qrImageUrl} alt="Attendance QR Code" className="w-32 h-32 object-contain rounded" />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Session QR Target</p>
        </div>
      </div>

      {/* Inline Management Override Panel */}
      {isEditing && (
        <form onSubmit={handleUpdateSubmission} className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid gap-4 sm:grid-cols-2 animate-in fade-in duration-200">
          <h3 className="sm:col-span-2 text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
            Live Administrative Adjustments
          </h3>
          {settingsState?.error && <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 p-2.5 rounded-md">{settingsState.error}</p>}
          
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Modify Event Name</label>
            <input name="name" defaultValue={event.name} required className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Calendar Date</label>
            <input type="date" name="event_date" defaultValue={event.event_date} required className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Attendance Gate Opens</label>
            <input type="datetime-local" name="start_time" defaultValue={event.start_time ? event.start_time.substring(0,16) : ""} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Attendance Gate Closes</label>
            <input type="datetime-local" name="end_time" defaultValue={event.end_time ? event.end_time.substring(0,16) : ""} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Manual Gateway Override Control</label>
            <select name="force_status" defaultValue="auto" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white font-medium text-indigo-700">
              <option value="auto">⏱ Automatic (Evaluate input open/close dates above)</option>
              <option value="open">🟢 Force Gateway Open (Allow all registrations right now)</option>
              <option value="closed">🔴 Force Gateway Closed (Lock tracking right now)</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-md border px-4 py-1.5 text-sm font-medium bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSettingsPending} style={{ backgroundColor: event.theme_color }} className="rounded-md px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">
              {isSettingsPending ? "Saving Modifications..." : "Save Settings Changes"}
            </button>
          </div>
        </form>
      )}

      {/* DEPARTMENT COUNTER DISPLAY GRIDS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Real-Time College/Department Counters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.keys(departmentMetrics).length === 0 ? (
            <div className="col-span-full py-4 text-center text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed">
              Awaiting student entries to map department distribution metrics...
            </div>
          ) : (
            Object.entries(departmentMetrics).map(([deptName, count]) => (
              <div key={deptName} className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deptName}</span>
                <span className="text-3xl font-black text-slate-800 mt-1">{count}</span>
                <span className="text-[10px] font-medium text-slate-500 mt-0.5">Checked In</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Roster Progress Visual Card */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Attendance Volume Overview</p>
          <p className="text-sm text-slate-500">
            {checkInCount} dynamic submittals recorded {isClosedRosterEvent && `out of ${totalRosterCount} expected`}
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPercentage}%`, backgroundColor: event.theme_color }} />
        </div>
      </div>

      {/* Main Registry Sections */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1 self-start">
            <button onClick={() => setActiveTab("present")} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === "present" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              Present ({presentList.length})
            </button>
            {isClosedRosterEvent && (
              <button onClick={() => setActiveTab("absent")} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === "absent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                Absent ({absentList.length})
              </button>
            )}
          </div>

          <div className="w-full sm:w-72">
            <input type="text" placeholder="Filter parameters by section code..." value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" />
          </div>
        </div>

        {/* Data Output Box */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No matching student profiles found on this layout index.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student Full Name</th>
                  <th className="px-6 py-3">Section</th>
                  <th className="px-6 py-3">Status Parameter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{student.full_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">{student.section}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${student.has_checked_in ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20" : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"}`}>
                        {student.has_checked_in ? "Checked In" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}