import { supabase } from "@/lib/supabaseClient";
import { logout } from "./actions";
import { EventRecord } from "@/types";
import Link from "next/link";
// Import the new advanced client-side creation form component
import EventCreateForm from "./EventCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const eventList = (events ?? []) as EventRecord[];

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <form action={logout}>
          <button className="text-sm text-slate-500 underline hover:text-slate-700">
            Log out
          </button>
        </form>
      </div>

      {/* The container section now hosts the modular EventCreateForm */}
      <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Create New Event
        </h2>
        <EventCreateForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Your Events
        </h2>
        {error && (
          <p className="text-red-600">Failed to load events: {error.message}</p>
        )}
        {eventList.length === 0 && (
          <p className="text-slate-500">No events yet. Create one above.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {eventList.map((event) => (
            <Link
              key={event.id}
              href={`/admin/${event.id}`}
              className="block rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{event.name}</h3>
              <p className="text-sm text-slate-500">
                {new Date(event.event_date + "T00:00:00").toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
              {event.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {event.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}