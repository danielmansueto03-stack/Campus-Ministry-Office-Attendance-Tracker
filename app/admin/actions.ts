"use server";

import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const event_date = formData.get("event_date") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || !event_date) {
    throw new Error("Event name and date are required.");
  }

  const { error } = await supabase
    .from("events")
    .insert({ name, event_date, description });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", { path: "/", maxAge: 0 });
  redirect("/admin/login");
}