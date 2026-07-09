import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import AttendanceDashboardClient from "./AttendanceDashboardClient";
import Link from "next/link";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export const revalidate = 0; // Disable caching for active live metric updates

export default async function AttendanceDashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { eventId } = resolvedParams;

  // 1. Fetch Event Details
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return notFound();
  }

  // 2. Fetch Attendance Log Activity Timeline
  const { data: attendanceLog } = await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  // 3. Fetch Master Event Roster Rows
  const { data: rosterRows } = await supabaseAdmin
    .from("event_roster")
    .select("*")
    .eq("event_id", eventId)
    .order("full_name", { ascending: true });

  // Map database states to client interface structures safely
  const formattedRoster = (rosterRows || []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    section: row.section,
    has_checked_in: row.has_checked_in ?? false,
  }));

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Top Main Navigation Bar Component */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 mb-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
          >
            ← Back to Admin Dashboard
          </Link>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-500">
            ID: {eventId}
          </span>
        </div>
      </header>

      <AttendanceDashboardClient 
        event={event} 
        attendanceLog={attendanceLog || []} 
        roster={formattedRoster} 
      />
    </div>
  );
}