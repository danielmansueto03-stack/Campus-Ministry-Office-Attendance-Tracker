"use client";

import { useState } from "react";

// 1. Explicitly define what properties an Event record has
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

// 2. Explicitly define what an Attendance Log entry has
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

// 3. Update the main component properties definition to use them
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
  // State management for tabs and text search
  const [activeTab, setActiveTab] = useState<"present" | "absent">("present");
  const [sectionFilter, setSectionFilter] = useState("");

  // Filter roster items into corresponding lists
  const presentList = roster.filter((student) => student.has_checked_in);
  const absentList = roster.filter((student) => !student.has_checked_in);
  
  // Calculate analytics metrics
  const totalRoster = roster.length;
  const checkInCount = presentList.length;
  const percentage = totalRoster ? Math.round((checkInCount / totalRoster) * 100) : 0;

  // Dynamically select our targeted list and filter it by the input section string
  const targetList = activeTab === "present" ? presentList : absentList;
  const filteredStudents = targetList.filter((student) =>
    student.section.toLowerCase().includes(sectionFilter.trim().toLowerCase())
  );

  // Fixed: Update path spelling to /checkin/ to precisely match your [eventID] folder setup
  const checkInUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/checkin/${event.id}`
    : `/checkin/${event.id}`;

  // Use a reliable open-source QR API to render the vector block automatically
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Top Banner Layout Section with Dynamic QR Code Display */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Live Event Session
          </span>
          <h1 className="text-3xl font-bold text-slate-900">{event.name} Dashboard</h1>
          <p className="text-slate-500">Roster management and active live metrics overview</p>
          <div className="pt-2">
            <a 
              href={checkInUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline"
            >
              Open Direct Student Check-in Link ↗
            </a>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 text-center shrink-0">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner">
            <img 
              src={qrImageUrl} 
              alt="Attendance Check-In QR Code" 
              className="w-40 h-40 object-contain rounded"
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Scan to Check In</p>
        </div>
      </div>

      {/* Progress Metric Visual Card */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Attendance Progress ({percentage}%)
          </p>
          <p className="text-sm text-slate-500">
            {checkInCount} of {totalRoster} expected attendees accounted for
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Main Roster Management Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Master Roster Status</h2>
        
        {/* Controls: Tabs & Section input filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1 self-start">
            <button
              onClick={() => setActiveTab("present")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                activeTab === "present" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Present ({presentList.length})
            </button>
            <button
              onClick={() => setActiveTab("absent")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                activeTab === "absent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Absent ({absentList.length})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Filter list by section (e.g. 1-K)..."
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Roster Output Data Table Container */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching students found on the {activeTab} list.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student Full Name</th>
                  <th className="px-6 py-3">Section</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {student.full_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                        {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          student.has_checked_in
                            ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                            : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                        }`}
                      >
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

      {/* Live Recent Check-In Feed Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Recent Activity Timeline</h2>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          {attendanceLog.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No check-ins recorded yet for this session.</p>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {attendanceLog.slice(0, 5).map((log, index) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {index !== attendanceLog.slice(0, 5).length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white text-green-600 text-sm">
                            ✓
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-slate-800">
                              <span className="font-semibold text-slate-900">{log.student_name}</span> from section{" "}
                              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{log.section}</span> successfully checked in.
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-xs text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}