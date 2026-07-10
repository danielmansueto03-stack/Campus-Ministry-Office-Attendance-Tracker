"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { submitCheckIn } from "./actions"; 

// Match the ActionState interface defined inside your actions.ts
const initialState = { success: false, error: "" };

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

  // 1. Hook up the formal React Action State with your server action
  const [state, formAction, isPending] = useActionState(submitCheckIn, initialState);

  // 2. Lock synchronization time safely
  const [clientTime, setClientTime] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClientTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 3. The Interceptor: Compile the standard fields into the layout expected by actions.ts
  const handleFormSubmission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reconstruct Last, First M.I. layout authorized by your roster script
    const miPart = middleInitial.trim() ? ` ${middleInitial.trim()}.` : "";
    const compiledFullName = `${lastName.trim()}, ${firstName.trim()}${miPart}`;

    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("fullName", compiledFullName);
    formData.append("section", section);

    // Fire the server transition securely
    startTransition(() => {
      formAction(formData);
    });
  };

  // 4. Render explicit Success UI state upon successful backend confirmation
  if (state?.success) {
    return (
      <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
        <h3 className="text-lg font-semibold text-emerald-800 mb-1">Check-In Successful!</h3>
        <p className="text-sm text-emerald-600">
          Your attendance profile has been recorded on the roster. You may safely close this window.
        </p>
      </div>
    );
  }

  if (clientTime === null) {
    return <p className="text-center text-slate-400 text-sm">Synchronizing event schedule...</p>;
  }

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
    // Update action processing target to use our custom structural compilation handler
    <form onSubmit={handleFormSubmission} className="grid gap-4">
      <p className="text-sm text-slate-500">
        Enter your complete official name and section exactly as they appear on the
        official roster.
      </p>

      {/* Capture server errors returned by your database atomic check script */}
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
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
        disabled={isPending}
        style={{ backgroundColor: themeColor }}
        className="mt-2 rounded-lg py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60 shadow-sm"
      >
        {isPending ? "Validating..." : "Check In"}
      </button>
    </form>
  );
}