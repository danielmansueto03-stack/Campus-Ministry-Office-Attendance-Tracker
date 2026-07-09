import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export const getCachedEvent = unstable_cache(
  async (eventId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    if (error) return null;
    return data;
  },
  ["event-by-id"],
  { revalidate: 15, tags: ["events"] }
);