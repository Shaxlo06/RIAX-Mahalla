"use client";

import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase sozlanmagan. .env.local faylini tekshiring.");
  return createBrowserClient(url, key);
}
