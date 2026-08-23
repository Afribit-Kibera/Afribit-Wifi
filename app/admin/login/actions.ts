"use server";

import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function loginAction(_previous: { error: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const valid = await verifyAdminCredentials(email, password);
  if (!valid) return { error: "Email or password is incorrect." };
  await createAdminSession(email.trim().toLowerCase());
  redirect("/admin");
}

