import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import CheckInForm from "./CheckInForm";
import { EventRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function CheckInPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.eventId)
    .single();

  if (!event) {
    notFound();
  }

  const eventData = event as EventRecord;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{eventData.name}</h1>
        <p className="text-slate-500">
          {new Date(eventData.event_date + "T00:00:00").toLocaleDateString(
            undefined,
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </p>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <CheckInForm eventId={eventData.id} />
      </div>
    </main>
  );
}