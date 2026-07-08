"use client";

import { useState } from "react";
import { COLLEGES, YEAR_LEVELS } from "@/data/colleges";
import { submitAttendance } from "./actions";

export default function CheckInForm({ eventId }: { eventId: string }) {
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const collegeConfig = college ? COLLEGES[college] : null;
  const isBED = !!collegeConfig?.isBasicEd;

  const handleCollegeChange = (value: string) => {
    setCollege(value);
    setCourse("");
    setYearLevel("");
    setSection("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("college", college);
    formData.set("course", course);
    if (isBED) {
      formData.set("section", section);
    } else {
      formData.set("year_level", yearLevel);
    }

    const result = await submitAttendance(eventId, formData);
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-700">
          ✅ You&apos;re checked in, {fullName}!
        </p>
        <p className="mt-1 text-sm text-emerald-600">
          Thank you for confirming your attendance.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          College
        </label>
        <select
          value={college}
          onChange={(e) => handleCollegeChange(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select College</option>
          {Object.keys(COLLEGES).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {collegeConfig && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {isBED ? "Grade Level" : "Course"}
          </label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select {isBED ? "Grade Level" : "Course"}</option>
            {collegeConfig.courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {collegeConfig && isBED && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Section / Strand
          </label>
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
            placeholder="e.g. STEM-A"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {collegeConfig && !isBED && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Year Level
          </label>
          <select
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Year Level</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Check In"}
      </button>
    </form>
  );
}