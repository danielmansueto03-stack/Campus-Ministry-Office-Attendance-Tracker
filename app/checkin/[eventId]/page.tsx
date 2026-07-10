import { notFound } from "next/navigation";
import { getCachedEvent } from "@/lib/getCachedEvent";
// Force the absolute correct name pairing. 
// If your file on disk is "CheckInForm.tsx", keep it as written below.
import CheckInForm from "./CheckInForm";

// Add this line to force Next.js to evaluate the opening times completely live:
export const dynamic = "force-dynamic"; 

// You can delete or keep export const revalidate = 15; 
// export const dynamic = "force-dynamic" takes total priority.

export const revalidate = 15;

const BACKGROUND_STYLES: Record<string, string> = {
  "solid-light": "bg-slate-50",
  "solid-dark": "bg-slate-900",
  "gradient-indigo": "bg-gradient-to-br from-indigo-600 to-purple-700",
};

type EventStatus = "not_started" | "open" | "closed";

function getEventStatus(startTime: string | null, endTime: string | null): EventStatus {
  const now = Date.now();
  if (startTime && now < new Date(startTime).getTime()) return "not_started";
  if (endTime && now > new Date(endTime).getTime()) return "closed";
  return "open";
}

// Next.js 15 requires params to be an explicitly declared Promise interface
interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
  // Await the asynchronous route parameters map 
  const resolvedParams = await params;
  const { eventId } = resolvedParams;

  const event = await getCachedEvent(eventId);

  if (!event) {
    notFound();
  }

  const status = getEventStatus(event.start_time, event.end_time);
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
          {status === "not_started" && (
            <p className="text-center text-slate-600">
              Attendance opens at{" "}
              {event.start_time
                ? new Date(event.start_time).toLocaleString()
                : "the scheduled time"}
              .
            </p>
          )}
          {status === "closed" && (
            <p className="text-center text-slate-600">
              Attendance for this event is now closed.
            </p>
          )}
          {status === "open" && <CheckInForm eventId={event.id} themeColor={themeColor} />}
        </div>
      </div>
    </main>
  );
}