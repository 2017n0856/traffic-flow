"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL") {
  const value = process.env[name];
  if (!value) {
    throw new Error("Missing Supabase env var: NEXT_PUBLIC_SUPABASE_URL.");
  }
  return value;
}

function getRequiredPublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(
      "Missing Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return value;
}

export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabasePublicKey = getRequiredPublicKey();
  return createBrowserClient<Database>(supabaseUrl, supabasePublicKey);
}
