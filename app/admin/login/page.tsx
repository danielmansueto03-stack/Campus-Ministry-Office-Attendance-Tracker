import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          Admin Login
        </h1>
        {resolvedParams?.error && (          <p className="mb-4 rounded-md bg-red-50 p-2 text-center text-sm text-red-600">
            Incorrect password. Please try again.
          </p>
        )}        <label className="mb-2 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Log In
        </button>
      </form>
    </main>
  );
}