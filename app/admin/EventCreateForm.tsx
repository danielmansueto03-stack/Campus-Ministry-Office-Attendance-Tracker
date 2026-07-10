import { notFound } from "next/navigation";
import { getCachedEvent } from "@/lib/getCachedEvent";
import checkinform from "./checkinform";

export const dynamic = "force-dynamic";

const BACKGROUND_STYLES: Record<string, string> = {
  "solid-light": "bg-slate-50",
  "solid-dark": "bg-slate-900",
  "gradient-indigo": "bg-gradient-to-br from-indigo-600 to-purple-700",
};

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { eventId } = resolvedParams;

  const event = await getCachedEvent(eventId);

  if (!event) {
    notFound();
  }

  const backgroundStyle = event.background_style ?? "solid-light";
  const bgClass = BACKGROUND_STYLES[backgroundStyle] ?? BACKGROUND_STYLES["solid-light"];
  const isDark = backgroundStyle !== "solid-light";
  const themeColor = event.theme_color || "#4f46e5";

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-6 ${bgClass}`}>
      <div className="w-full max-w-md">
        {event.banner_url && (
          <img
            src={event.banner_url}
            alt={`${event.name} banner`}
            className="mb-6 w-full rounded-xl object-cover"
          />
        )}

        <div className={`mb-6 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className={isDark ? "text-slate-200" : "text-slate-500"}>
            {new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          {/* We pass all parameters directly to the client form, which now handles the clock evaluation natively */}
          <CheckInForm 
            eventId={event.id} 
            themeColor={themeColor} 
            startTime={event.start_time}
            endTime={event.end_time}
          />
        </div>
      </div>
    </main>
  );
}