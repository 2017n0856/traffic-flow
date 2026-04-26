"use client";

import type { Profile } from "@/types/supabase";

export type UsersResponse = {
  users: Profile[];
  currentUserId: string;
};

export async function fetchAdminUsers() {
  const response = await fetch("/api/admin/users", { cache: "no-store" });
  const payload = (await response.json()) as UsersResponse & { error?: string };
  return { response, payload };
}
