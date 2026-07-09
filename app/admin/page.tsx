import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function AdminDashboard() {
  // Fetch all active sessions ordered by date
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  // Server Action inline handler to wipe an unwanted session instantly
  async function deleteEventAction(formData: FormData) {
    "use server";
    const eventId = formData.get("eventId") as string;
    if (!eventId) return;

    // Remove event row cascading automatically takes care of rosters/logs
    await supabaseAdmin.from("events").delete().eq("id", eventId);
    
    revalidatePath("/admin");
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8 min-h-screen bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Central Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Create, monitor, and manage your institutional live sessions.</p>
        </div>
        <Link
          href="/admin/create"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition text-center"
        >
          + Create New Event Session
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl">
          Error retrieving active sessions: {error.message}
        </div>
      )}

      {(!events || events.length === 0) ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-6">
          <p className="text-slate-400 text-sm">No live sessions recorded. Click the button above to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((session) => (
            <div 
              key={session.id} 
              className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  {new Date(session.event_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                  {session.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{session.description || "No session description provided."}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                <Link
                  href={`/admin/${session.id}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  View Dashboard →
                </Link>

                <form action={deleteEventAction} onSubmit={(e) => {
                  if (!confirm("Are you completely sure you want to permanently delete this event and all associated rosters?")) {
                    e.preventDefault();
                  }
                }}>
                  <input type="hidden" name="eventId" value={session.id} />
                  <button
                    type="submit"
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium opacity-60 group-hover:opacity-100 transition px-2 py-1 rounded hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}