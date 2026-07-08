import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import EventQRCode from "@/components/EventQRCode";
import AttendanceDashboardClient from "./AttendanceDashboardClient";
import { AttendanceRecord, EventRecord } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = await params;

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", resolvedParams.eventId)
    .single();

  if (!event) {
    notFound();
  }

  const { data: attendance } = await supabase
    .from("attendance")
    .select("*")
    .eq("event_id", resolvedParams.eventId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <Link href="/admin" className="mb-4 inline-block text-sm text-indigo-600 underline">
        ← Back to all events
      </Link>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {(event as EventRecord).name}
          </h1>
          <p className="text-slate-500">
            {new Date(
              (event as EventRecord).event_date + "T00:00:00"
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {(event as EventRecord).description && (
            <p className="mt-2 max-w-xl text-slate-600">
              {(event as EventRecord).description}
            </p>
          )}
        </div>
        <EventQRCode eventId={(event as EventRecord).id} />
      </div>
      <AttendanceDashboardClient
        event={event as EventRecord}
        initialRecords={(attendance ?? []) as AttendanceRecord[]}
      />
    </main>
  );
}