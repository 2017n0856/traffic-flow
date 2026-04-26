"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminUsers } from "@/services/client/admin-users";
import type { Profile } from "@/types/supabase";

export function useAdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { response, payload } = await fetchAdminUsers();
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
