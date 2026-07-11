"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

// 1. Define the explicit shape of the action state
interface ActionState {
  success: boolean;
  error: string;
}

function normalizeNamePart(v: string) {
  return v.trim().replace(/\s+/g, " ");
}

// 2. Use the interface type instead of 'any'
export async function submitCheckIn(prevState: ActionState | null, formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const fullNameRaw = (formData.get("fullName") as string) || "";
  const sectionRaw = (formData.get("section") as string) || "";
  
  const college = (formData.get("college") as string) || "";
  const course = (formData.get("course") as string) || "";
  const yearLevel = (formData.get("yearLevel") as string) || "";

  const fullName = normalizeNamePart(fullNameRaw);

  if (!eventId || !fullName || !sectionRaw || !college || !course || !yearLevel) {
    return { success: false, error: "Please complete all required identity inputs before checking in." };
  }

  // Compile the detailed academic section for your analytics dashboard
  const compiledSection = isNaN(parseInt(yearLevel))
    ? `${college} - ${course} - ${normalizeNamePart(sectionRaw)}`
    : `${college} - ${course} (${yearLevel}) - ${normalizeNamePart(sectionRaw)}`;
    
  const richSection = compiledSection.toUpperCase();

  // 1. Fetch event timing to ensure it is open
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("start_time, end_time")
    .eq("id", eventId)
    .single();

  if (!event || eventError) {
    return { success: false, error: "Event could not be verified." };
  }

  const now = new Date().getTime();
  if (event.start_time && now < new Date(event.start_time).getTime()) {
    return { success: false, error: "Attendance for this event has not opened yet." };
  }
  if (event.end_time && now > new Date(event.end_time).getTime()) {
    return { success: false, error: "Attendance for this event is now closed." };
  }

  // 2. Check if the event has a roster, and if the student is on it (BY NAME ONLY)
  const { count: rosterCount } = await supabase
    .from("event_roster")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (rosterCount && rosterCount > 0) {
    const { data: rosterEntry } = await supabase
      .from("event_roster")
      .select("id")
      .eq("event_id", eventId)
      .ilike("full_name", fullName) // ilike makes it safely case-insensitive
      .maybeSingle();

    if (!rosterEntry) {
      return {
        success: false,
        error: "Record not found on the official event roster. Please double check your spelling and name sequence.",
      };
    }
  }

  // 3. Check if the student has already checked in to prevent duplicates
  const { data: existingEntry } = await supabase
    .from("attendance")
    .select("id")
    .eq("event_id", eventId)
    .ilike("full_name", fullName)
    .maybeSingle();

  if (existingEntry) {
    return { success: false, error: "This student profile has already checked in." };
  }

  // 4. Insert the final attendance record with the detailed track data!
  const { error: insertError } = await supabase
    .from("attendance")
    .insert({
      event_id: eventId,
      full_name: fullName,
      section: richSection, 
    });

  if (insertError) {
    return { success: false, error: "Failed to record attendance. Please try again." };
  }

  // Purge the cache so the admin dashboard updates instantly
  revalidatePath(`/admin/${eventId}`);
  
  return { success: true, error: "" };
}