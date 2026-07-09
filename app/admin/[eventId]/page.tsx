import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Uses service role for complete roster visibility
import AttendanceDashboardClient from "./AttendanceDashboardClient"; // Your client component

export default async function AdminEventDashboard({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  // 1. Await params safely
  const resolvedParams = await params;
  const eventId = resolvedParams.eventId;

  // 2. Fetch the event details
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) {
    notFound();
  }

  // 3. Fetch the student attendance log records
  const { data: attendanceLog } = await supabase
    .from("attendance")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  // 4. Fetch the master event roster using the admin client
  const { data: roster } = await supabaseAdmin
    .from("event_roster")
    .select("*")
    .eq("event_id", eventId)
    .order("full_name", { ascending: true });

  return (
    <AttendanceDashboardClient 
      event={event} 
      attendanceLog={attendanceLog ?? []} 
      roster={roster ?? []} 
    />
  );
}