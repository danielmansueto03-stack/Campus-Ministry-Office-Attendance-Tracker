"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 1. Guard check: Make sure the comparison variable exists
  if (!adminPassword) {
    console.error("CRITICAL CONFIG ERROR: ADMIN_PASSWORD is missing in Vercel settings.");
    redirect("/admin/login?error=system_configuration");
  }

  // 2. Track authentication status
  let isAuthed = false;

  if (password && password === adminPassword) {
    const cookieStore = await cookies();
    
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    isAuthed = true;
  }

  // 3. Next.js 15 Requirement: Always trigger redirects outside of conditional try/catch evaluation blocks
  if (isAuthed) {
    redirect("/admin");
  } else {
    redirect("/admin/login?error=1");
  }
}