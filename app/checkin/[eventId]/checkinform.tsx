"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { submitCheckIn } from "./actions"; 

// 1. Institutional data mapping for dropdown cascades
const ACADEMIC_DATA = {
  CHAP: {
    name: "College of Health and Allied Professions (CHAP)",
    courses: ["BSMT", "BSN", "BSPHARMA", "BSMIDWIFERY"],
  },
  CLASE: {
    name: "College of Liberal Arts and Sciences Education (CLASE)",
    courses: ["BSPSYCH", "BSED", "BAPOLSCI", "BSCHEM", "BSMATHEMATICS"],
  },
  CABECS: {
    name: "College of Accountancy, Business Education, and Computer Studies (CABECS)",
    courses: ["BSA", "BSAIS", "BSBA", "BSHM", "BSTM", "BSIT"],
  },
  COE: {
    name: "College of Engineering (COE)",
    courses: ["BSCE", "BSCHE", "BSME"],
  },
  CCJE: {
    name: "College of Criminal Justice Education (CCJE)",
    courses: ["BSCRIM"],
  },
  BED: {
    name: "Basic Education Department (BED)",
    courses: ["G7", "G8", "G9", "G10", "G11", "G12"],
  },
} as const;

type CollegeKey = keyof typeof ACADEMIC_DATA;

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
  
  // New tracking state fields for tracking metrics per college/course
  const [college, setCollege] = useState<CollegeKey | "">("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");

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

  const handleCollegeChange = (val: CollegeKey | "") => {
    setCollege(val);
    setCourse(""); // Purge active course choices to prevent layout mismatch anomalies
    if (val === "BED") {
      setYearLevel("N/A"); // Auto-assign high school entries as N/A
    } else {
      setYearLevel("");
    }
  };

  // 3. The Interceptor: Compile the fields into the layout expected by actions.ts
  const handleFormSubmission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reconstruct Last, First M.I. layout authorized by your roster script
    const miPart = middleInitial.trim() ? ` ${middleInitial.trim()}.` : "";
    const compiledFullName = `${lastName.trim()}, ${firstName.trim()}${miPart}`;

    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("fullName", compiledFullName);
    formData.append("section", section);
    
    // NEW: Pack the academic breakdown details safely into the formData payload
    formData.append("college", college);
    formData.append("course", course);
    formData.append("yearLevel", yearLevel);

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

  const isBasicEd = college === "BED";

  return (
    <form onSubmit={handleFormSubmission} className="grid gap-4">
      <p className="text-sm text-slate-500">
        Enter your complete official name and academic section parameters exactly to record your attendance.
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

      {/* NEW: College Dropdown Field Selection */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">College / Department</label>
        <select
          value={college}
          onChange={(e) => handleCollegeChange(e.target.value as CollegeKey | "")}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
        >
          <option value="">-- Select your College --</option>
          {Object.entries(ACADEMIC_DATA).map(([key, data]) => (
            <option key={key} value={key}>{data.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* NEW: Dynamic Dependent Course Selection Field */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {isBasicEd ? "Grade Level" : "Course"}
          </label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
            disabled={!college}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50"
            style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
          >
            <option value="">{!college ? "Select department" : "-- Choice --"}</option>
            {college &&
              ACADEMIC_DATA[college].courses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
          </select>
        </div>

        {/* NEW: Dynamic Year Level Selector */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Year Level</label>
          <select
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            required
            disabled={!college || isBasicEd}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50"
            style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
          >
            {isBasicEd ? (
              <option value="N/A">N/A (BED)</option>
            ) : (
              <>
                <option value="">-- Year --</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Retained: Section Input (Using text type as a wide-open customizable field) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Section</label>
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          required
          placeholder="e.g. A, 1-K, Block-2"
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