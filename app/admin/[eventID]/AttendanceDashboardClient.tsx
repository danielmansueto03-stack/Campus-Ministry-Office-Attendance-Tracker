"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord, EventRecord } from "@/types";
import { COLLEGES } from "@/data/colleges";

type SortKey = "full_name" | "college" | "course" | "year_or_section" | "created_at";

function exportToCSV(records: AttendanceRecord[], eventName: string) {
  const headers = [
    "Full Name",
    "College",
    "Course/Grade",
    "Year Level / Section",
    "Checked-in At",
  ];
  const rows = records.map((r) => [
    r.full_name,
    r.college,
    r.course,
    r.year_level ?? r.section ?? "",
    new Date(r.created_at).toLocaleString(),
  ]);
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${eventName.replace(/\s+/g, "_")}_attendance.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AttendanceDashboardClient({
  event,
  initialRecords,
}: {
  event: EventRecord;
  initialRecords: AttendanceRecord[];
}) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [filterCollege, setFilterCollege] = useState("ALL");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [filterYearSection, setFilterYearSection] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Realtime subscription: new check-ins appear instantly
  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          setRecords((prev) => [payload.new as AttendanceRecord, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  const countsByCollege = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.college] = (counts[r.college] ?? 0) + 1;
    });
    return counts;
  }, [records]);

  const courseOptions = useMemo(() => {
    if (filterCollege === "ALL") {
      return Array.from(new Set(records.map((r) => r.course))).sort();
    }
    return COLLEGES[filterCollege]?.courses ?? [];
  }, [filterCollege, records]);

  const yearSectionOptions = useMemo(() => {
    return Array.from(
      new Set(records.map((r) => r.year_level || r.section).filter(Boolean))
    ) as string[];
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      if (filterCollege !== "ALL" && r.college !== filterCollege) return false;
      if (filterCourse !== "ALL" && r.course !== filterCourse) return false;
      if (
        filterYearSection !== "ALL" &&
        r.year_level !== filterYearSection &&
        r.section !== filterYearSection
      )
        return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      const getValue = (r: AttendanceRecord) => {
        if (sortKey === "year_or_section") return r.year_level || r.section || "";
        return r[sortKey as keyof AttendanceRecord] ?? "";
      };
      const va = String(getValue(a)).toLowerCase();
      const vb = String(getValue(b)).toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, filterCollege, filterCourse, filterYearSection, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div>
      {/* Counter dashboard */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        <div className="rounded-xl bg-indigo-600 p-4 text-white shadow-sm">
          <p className="text-sm opacity-80">Total</p>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
        {Object.keys(COLLEGES).map((key) => (
          <div key={key} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{key}</p>
            <p className="text-2xl font-bold text-slate-900">
              {countsByCollege[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filters + export */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            College
          </label>
          <select
            value={filterCollege}
            onChange={(e) => {
              setFilterCollege(e.target.value);
              setFilterCourse("ALL");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All Colleges</option>
            {Object.keys(COLLEGES).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Course / Grade
          </label>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All Courses/Grades</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Year Level / Section
          </label>
          <select
            value={filterYearSection}
            onChange={(e) => setFilterYearSection(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All</option>
            {yearSectionOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => exportToCSV(filteredRecords, event.name)}
          className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Export CSV ({filteredRecords.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("full_name")}
              >
                Full Name{sortIndicator("full_name")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("college")}
              >
                College{sortIndicator("college")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("course")}
              >
                Course/Grade{sortIndicator("course")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("year_or_section")}
              >
                Year/Section{sortIndicator("year_or_section")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("created_at")}
              >
                Checked-in At{sortIndicator("created_at")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {r.full_name}
                </td>
                <td className="px-4 py-3">{r.college}</td>
                <td className="px-4 py-3">{r.course}</td>
                <td className="px-4 py-3">{r.year_level || r.section || "-"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No attendance records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}