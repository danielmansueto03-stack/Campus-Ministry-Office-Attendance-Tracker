"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

function normalizeNamePart(v: string) {
  return v.trim().replace(/\s+/g, " ");
}

export async function submitAttendance(eventId: string, formData: FormData) {
  const firstName = normalizeNamePart((formData.get("first_name") as string) || "");
  const middleInitial = normalizeNamePart((formData.get("middle_initial") as string) || "");
  const lastName = normalizeNamePart((formData.get("last_name") as string) || "");
  const section = normalizeNamePart((formData.get("section") as string) || "");

  if (!firstName || !lastName || !section) {
    return {
      success: false,
      error: "Please fill in your first name, last name, and section.",
    };
  }

  const firstMiddle = middleInitial ? `${firstName} ${middleInitial}` : firstName;
  const fullName = `${lastName}, ${firstMiddle}`;

  // Authoritative check happens here, inside the Postgres function, which
  // atomically re-verifies the time window and locks the roster row —
  // this is the "strict server-side" check, immune to race conditions
  // even under thousands of near-simultaneous submissions.
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
        return { success: false, error: "This name and section has already been checked in." };
      case "not_found":
        return { success: false, error: "This event could not be found." };
      case "not_on_roster":
      default:
        return {
          success: false,
          error:
            "Record not found on the official event roster. Please check your spelling/section or contact an administrator.",
        };
    }
  }

  revalidatePath(`/admin/${eventId}`);
  return { success: true };
}