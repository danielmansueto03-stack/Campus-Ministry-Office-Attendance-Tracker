"use client";

import { useState } from "react";
// Import the corrected action name from your check-in actions directory
import { submitCheckIn } from "./actions"; 

export default function CheckInForm({
  eventId,
  themeColor,
}: {
  eventId: string;
  themeColor: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // 1. Clean inputs up nicely
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanMiddle = middleInitial.trim().replace(/\./g, ""); // Strip any trailing dots if typed

    // 2. Format exactly to match: "LastName, FirstName M.I." (without the trailing dot)
    // Adjust this line if your roster table doesn't use the middle initial spacing!
    const cleanMiddlePart = cleanMiddle ? ` ${cleanMiddle}` : "";
    const formattedFullName = `${cleanLast}, ${cleanFirst}${cleanMiddlePart}`;

    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("fullName", formattedFullName);
    formData.set("section", section.trim().toUpperCase());

    // Call your production validation endpoint
    const result = await submitCheckIn(null, formData);
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
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
          ✓
        </div>
        {/* Fixed the typo here */}
        <p className="text-lg font-semibold text-emerald-700">
          You are checked in, {firstName}!
        </p>
        <p className="mt-1 text-sm text-emerald-600">
          Thank you for confirming your attendance.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="text-sm text-slate-500">
        Enter your complete official name and section exactly as they appear on the
        official roster.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Middle Initial</label>
          <input
            value={middleInitial}
            onChange={(e) => setMiddleInitial(e.target.value)}
            placeholder="M.I."
            maxLength={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Section</label>
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          required
          placeholder="e.g. 1-K"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase font-mono text-sm focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{ backgroundColor: themeColor }}
        className="mt-2 rounded-lg py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60 shadow-sm"
      >
        {submitting ? "Validating..." : "Check In"}
      </button>
    </form>
  );
}