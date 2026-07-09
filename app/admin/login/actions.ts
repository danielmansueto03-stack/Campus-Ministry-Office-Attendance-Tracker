"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Safety check to ensure the environment variable actually exists on Vercel
  if (!adminPassword) {
    console.error("CRITICAL ERROR: ADMIN_PASSWORD environment variable is missing on the server.");
    redirect("/admin/login?error=missing_config");
  }

  if (password && password === adminPassword) {
    const cookieStore = await cookies();
    
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Directly invoke redirect outside any conditional blocks if possible, or right here
    redirect("/admin");
  }
  
  redirect("/admin/login?error=1");
}