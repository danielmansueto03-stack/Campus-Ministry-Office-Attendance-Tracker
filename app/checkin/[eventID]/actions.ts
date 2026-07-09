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
  // Extract values from the adapted Form Data object
  const eventId = formData.get("eventId") as string;
  const fullNameRaw = (formData.get("fullName") as string) || "";
  const sectionRaw = (formData.get("section") as string) || "";

  const fullName = normalizeNamePart(fullNameRaw);
  const section = normalizeNamePart(sectionRaw).toUpperCase();

  if (!eventId) {
    return {
      success: false,
      error: "Critical Error: Event identification parameters are missing.",
    };
  }

  if (!fullName || !section) {
    return {
      success: false,
      error: "Please complete all required identity inputs before checking in.",
    };
  }

  // Authoritative server-side verification using your atomic postgres function
  const { data, error } = await supabase.rpc("check_in_student", {
    p_event_id: eventId,
    p_full_name: fullName,
    p_section: section,
  });

  if (error) {
    return {
      success: false,
      error: "Something went wrong. Please try again or notify an administrator.",
    };
  }

  const result = data as { success: boolean; error?: string; attendance_id?: string };

  if (!result.success) {
    switch (result.error) {
      case "not_started":
        return { success: false, error: "Attendance for this event has not opened yet." };
      case "closed":
        return { success: false, error: "Attendance for this event is now closed." };
      case "already_checked_in":
        return { success: false, error: "This student profile has already checked in." };
      case "not_found":
        return { success: false, error: "This event session target could not be verified." };
      case "not_on_roster":
      default:
        return {
          success: false,
          error:
            "Record not found on the official event roster. Please double check your spelling, name sequence, and section code.",
        };
    }
  }

  // Force Next.js to purge cache for the matching layout dashboards
  revalidatePath(`/admin/${eventId}`);
  
  return { success: true, error: "" };
}