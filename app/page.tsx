import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Attendance Tracker</h1>
      <p className="max-w-md text-slate-600">
        Manage events and track student attendance via QR code check-in.
      </p>
      <Link
        href="/admin/login"
        className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow hover:bg-indigo-700"
      >
        Go to Admin Dashboard
      </Link>
    </main>
  );
}