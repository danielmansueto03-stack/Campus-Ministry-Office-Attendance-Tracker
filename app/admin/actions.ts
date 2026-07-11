"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

interface RosterRow {
  event_id: string;
  full_name: string;
  section: string;
}

function parseRoster(raw: string, eventId: string) {
  const rows: RosterRow[] = [];
  let skipped = 0;

  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        skipped++;
        return;
      }
      const [lastName, firstMiddle, section] = parts;
      rows.push({
        event_id: eventId,
        full_name: `${lastName}, ${firstMiddle}`,
        section,
      });
    });

  return { rows, skipped };
}

export type CreateEventState = {
  success: boolean;
  error: string;
  skipped: number;
};

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const name = (formData.get("name") as string)?.trim();
  const event_date = formData.get("event_date") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const start_time = (formData.get("start_time") as string) || null;
  const end_time = (formData.get("end_time") as string) || null;
  const theme_color = (formData.get("theme_color") as string) || "#4f46e5";
  const background_style = (formData.get("background_style") as string) || "solid-light";
  const rosterRaw = (formData.get("roster") as string) || "";
  const bannerFile = formData.get("banner") as File | null;

  if (!name || !event_date) {
    return { success: false, error: "Event name and date are required.", skipped: 0 };
  }

  if (start_time && end_time && new Date(start_time) >= new Date(end_time)) {
    return { success: false, error: "Start time must be before end time.", skipped: 0 };
  }

  let banner_url: string | null = null;

  if (bannerFile && bannerFile.size > 0) {
    const ext = bannerFile.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("event-banners")
      .upload(path, bannerFile, { contentType: bannerFile.type, upsert: false });

    if (uploadError) {
      return { success: false, error: `Banner upload failed: ${uploadError.message}`, skipped: 0 };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("event-banners")
      .getPublicUrl(path);
    banner_url = publicUrlData.publicUrl;
  }

  const { data: eventRow, error: eventError } = await supabaseAdmin
    .from("events")
    .insert({
      name,
      event_date,
      description,
      start_time,
      end_time,
      theme_color,
      background_style,
      banner_url,
    })
    .select()
    .single();

  if (eventError || !eventRow) {
    return { success: false, error: eventError?.message ?? "Failed to create event.", skipped: 0 };
  }

  // Parse the roster string
  const { rows, skipped } = parseRoster(rosterRaw, eventRow.id);

  // CHANGED: Wrapped in a safety conditional block. Only insert if students exist in the parsed array.
  if (rows && rows.length > 0) {
    const { error: rosterError } = await supabaseAdmin.from("event_roster").insert(rows);
    if (rosterError) {
      return {
        success: false,
        error: `Event created, but roster upload failed: ${rosterError.message}`,
        skipped,
      };
    }
  }

  // Clear cache pathways safely
  revalidatePath("/admin");
  revalidatePath(`/checkin/${eventRow.id}`); 
  
  redirect(`/admin/${eventRow.id}`);
}

export async function logout() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", { path: "/", maxAge: 0 });
  
  redirect("/admin/login");
}

export type UpdateSettingsState = {
  success: boolean;
  error: string;
};

export async function updateEventSettings(
  _prevState: UpdateSettingsState,
  formData: FormData
): Promise<UpdateSettingsState> {
  const eventId = formData.get("eventId") as string;
  const name = (formData.get("name") as string)?.trim();
  const event_date = formData.get("event_date") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const start_time = (formData.get("start_time") as string) || null;
  const end_time = (formData.get("end_time") as string) || null;
  const theme_color = (formData.get("theme_color") as string) || "#4f46e5";
  const force_status = (formData.get("force_status") as string) || "auto"; 

  if (!eventId || !name || !event_date) {
    return { success: false, error: "Event identity parameters, title, and target calendar dates are required." };
  }

  // Authoritative operational patch payload assembly
  const { error: patchError } = await supabaseAdmin
    .from("events")
    .update({
      name,
      event_date,
      description,
      start_time,
      end_time,
      theme_color,
    })
    .eq("id", eventId);

  if (patchError) {
    return { success: false, error: `Failed to modify session properties: ${patchError.message}` };
  }

  // Synchronize state contexts immediately across matching server tree maps
  revalidatePath(`/admin/${eventId}`);
  revalidatePath(`/checkin/${eventId}`);

  return { success: true, error: "" };
}