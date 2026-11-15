import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try { await (await createClient()).auth.signOut(); } catch { /* demo mode */ }
  const response = NextResponse.json({ ok: true });
  for (const name of ["riax_role", "riax_name", "riax_user_id"]) response.cookies.set(name, "", { path: "/", maxAge: 0 });
  return response;
}
