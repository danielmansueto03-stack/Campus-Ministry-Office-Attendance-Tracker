"use client";

import QRCode from "react-qr-code";

export default function EventQRCode({ eventId }: { eventId: string }) {
  // If we are rendering on the server side, use a placeholder or site URL
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const url = `${base}/checkin/${eventId}`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <QRCode value={url} size={180} />
      <p className="max-w-55 break-all text-center text-xs text-slate-500">
        {url}
      </p>
      <a
        href={url}
        target="_blank"
        className="text-xs font-medium text-indigo-600 underline"
      >
        Open check-in page
      </a>
    </div>
  );
}