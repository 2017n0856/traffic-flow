"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function getRequiredSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value?.trim()) {
    throw new Error("Missing Supabase env var: NEXT_PUBLIC_SUPABASE_URL.");
  }
  return value;
}

function getRequiredPublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value?.trim()) {
    throw new Error(
      "Missing Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return value;
}

export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const supabaseUrl = getRequiredSupabaseUrl();
  const supabasePublicKey = getRequiredPublicKey();
  return createBrowserClient<Database>(supabaseUrl, supabasePublicKey);
}
