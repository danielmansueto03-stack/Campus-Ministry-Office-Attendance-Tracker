"use client";

import { useActionState, startTransition } from "react";
import { createEvent, CreateEventState } from "./actions";

const initialState: CreateEventState = { success: false, error: "", skipped: 0 };

export default function EventCreateForm() {
  const [state, formAction, isPending] = useActionState(createEvent, initialState);

  const handleAction = (formData: FormData) => {
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;

    if (startTime) {
      formData.set("start_time", new Date(startTime).toISOString());
    }
    if (endTime) {
      formData.set("end_time", new Date(endTime).toISOString());
    }

    // Wrap the manual call in startTransition to satisfy TypeScript!
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form action={handleAction} className="grid gap-4 sm:grid-cols-2">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 sm:col-span-2">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Event Name</label>
        <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
        <input type="date" name="event_date" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
        <textarea name="description" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Attendance Opens</label>
        <input type="datetime-local" name="start_time" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Attendance Closes</label>
        <input type="datetime-local" name="end_time" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Theme Color</label>
        <input type="color" name="theme_color" defaultValue="#4f46e5" className="h-10 w-full rounded-lg border border-slate-300" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Background Style</label>
        <select name="background_style" className="w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="solid-light">Solid Light</option>
          <option value="solid-dark">Solid Dark</option>
          <option value="gradient-indigo">Gradient Indigo</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Banner Image (optional)</label>
        <input type="file" name="banner" accept="image/*" className="w-full text-sm" />
      </div>

      {/* CHANGED: Made roster field completely optional */}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Expected Roster (Optional)
        </label>
        <p className="mb-2 text-xs text-slate-500">
          One student per line: <code>Last Name, First Name M.I., Section</code> — e.g.{" "}
          <code>Doe, John A., 1-K</code>. <strong>Leave blank for open public events (e.g., school-wide).</strong>
        </p>
        <textarea
          name="roster"
          rows={8}
          placeholder={"Doe, John A., 1-K\nSmith, Jane, 1-A"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        {state?.skipped > 0 && (
          <p className="mt-1 text-xs text-amber-600">
            {state.skipped} line(s) were skipped on the last attempt due to formatting.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}