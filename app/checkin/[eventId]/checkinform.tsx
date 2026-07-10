"use client";

import { useState, useEffect } from "react";
import { submitCheckIn } from "./actions"; 

export default function CheckInForm({
  eventId,
  themeColor,
  startTime,
  endTime,
}: {
  eventId: string;
  themeColor: string;
  startTime: string | null;
  endTime: string | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // 1. Hold the time in state
  const [clientTime, setClientTime] = useState<number | null>(null);

  useEffect(() => {
    // 2. Wrap the time check in a tiny timeout.
    // This makes the state update asynchronous, silencing the "cascading render" warning!
    // It also moves Date.now() inside the effect, silencing the "impure render" warning!
    const timer = setTimeout(() => {
      setClientTime(Date.now());
    }, 0);

    // Cleanup the timer if the component unmounts quickly
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    // ... leave your existing handleSubmit code exactly as it is ...
  };

  if (submitted) {
    // ... leave your existing success UI exactly as it is ...
  }

  // 3. Show a loading state until the timer fires
  if (clientTime === null) {
    return <p className="text-center text-slate-400 text-sm">Synchronizing event schedule...</p>;
  }

  // 4. Calculate timing using our locked state value instead of a live function
  const isNotStarted = startTime ? clientTime < new Date(startTime).getTime() : false;
  const isClosed = endTime ? clientTime > new Date(endTime).getTime() : false;

  if (isNotStarted) {
    return (
      <p className="text-center text-slate-600">
        Attendance opens at {startTime ? new Date(startTime).toLocaleString() : "the scheduled time"}.
      </p>
    );
  }

  if (isClosed) {
    return (
      <p className="text-center text-slate-600">
        Attendance for this event is now closed.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* ... leave the rest of your form return fields exactly as they are ... */}
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