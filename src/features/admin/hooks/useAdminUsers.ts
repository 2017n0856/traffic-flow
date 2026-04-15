"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/types/supabase";

type UsersResponse = {
  users: Profile[];
  currentUserId: string;
};

export function useAdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json()) as UsersResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load users.");
      }
      setUsers(payload.users);
      setCurrentUserId(payload.currentUserId ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return { users, currentUserId, loading, error, refresh: loadUsers };
}
