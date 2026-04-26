"use client";

import { createClient } from "@/utils/supabase/client";

export async function getAuthSession() {
  const supabase = createClient();
  return supabase.auth.getSession();
}

export async function getAuthUser() {
  const supabase = createClient();
  return supabase.auth.getUser();
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        phone: params.phone,
      },
    },
  });
}

export async function signOutUser() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getUserRole(userId: string) {
  const supabase = createClient();
  return supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: "admin" | "user" | null }>();
}
