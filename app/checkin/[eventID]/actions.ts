"use server";

import { supabase } from "@/lib/supabaseClient";
import { COLLEGES } from "@/data/colleges";
import { revalidatePath } from "next/cache";

export async function submitAttendance(eventID: string, formData: FormData) {
  const full_name = (formData.get("full_name") as string)?.trim();
  const college = formData.get("college") as string;
  const course = formData.get("course") as string;
  const year_level = formData.get("year_level") as string | null;
  const section = (formData.get("section") as string | null)?.trim() || null;

  if (!full_name || !college || !course) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const collegeConfig = COLLEGES[college];
  if (!collegeConfig || !collegeConfig.courses.includes(course)) {
    return { success: false, error: "Invalid college/course selection." };
  }

  const isBED = !!collegeConfig.isBasicEd;
  if (isBED && !section) {
    return { success: false, error: "Section/Strand is required." };
  }
  if (!isBED && !year_level) {
    return { success: false, error: "Year level is required." };
  }

  const { error } = await supabase.from("attendance").insert({
    event_id: eventID,
    full_name,
    college,
    course,
    year_level: isBED ? null : year_level,
    section: isBED ? section : null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/${eventID}`);
  return { success: true };
}