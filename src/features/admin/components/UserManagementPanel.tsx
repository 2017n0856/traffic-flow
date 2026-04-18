"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/types/supabase";
import {
  adminBodyMutedClass,
  adminFormControlClass,
  adminFormFieldErrorClass,
  adminFormLabelClass,
  adminSectionTitleClass,
  adminTableHeaderClass,
} from "@/lib/ui/form";

type UserManagementPanelProps = {
  users: Profile[];
  currentUserId: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((json as { error?: string }).error ?? "Request failed");
  }
  return json;
}

export function UserManagementPanel({
  users,
  currentUserId,
  loading,
  error,
  onRefresh,
}: UserManagementPanelProps) {
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const visibleUsers = currentUserId
      ? users.filter((user) => user.id !== currentUserId)
      : users;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return visibleUsers;
    return visibleUsers.filter((user) => user.email.toLowerCase().includes(normalized));
  }, [currentUserId, query, users]);

  async function updateRole(id: string, role: "user" | "admin") {
    setSavingId(id);
    setFormError(null);
    try {
      await parseResponse(
        await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }),
      );
      await onRefresh();
    } catch (requestError) {
      setFormError(
        requestError instanceof Error ? requestError.message : "Failed to update user role.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id: string) {
    setSavingId(id);
    setFormError(null);
    try {
      await parseResponse(await fetch(`/api/admin/users/${id}`, { method: "DELETE" }));
      await onRefresh();
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "Failed to delete user.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={adminSectionTitleClass}>Users</h2>
            <p className={`mt-1 ${adminBodyMutedClass}`}>
              Search accounts and update roles to manage admin privileges.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-1.5">
            <label htmlFor="user-search" className={`block ${adminFormLabelClass}`}>
              Search by email
            </label>
            <input
              id="user-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${adminFormControlClass} max-w-xs`}
              placeholder="Filter list…"
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-base font-normal text-zinc-500">Loading users...</p>
        ) : null}
        {error ? <p className={`mt-4 ${adminFormFieldErrorClass}`}>{error}</p> : null}
        {formError ? <p className={`mt-4 ${adminFormFieldErrorClass}`}>{formError}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-base dark:divide-zinc-800">
            <thead>
              <tr>
                <th className={`py-2 pr-4 ${adminTableHeaderClass}`}>Email</th>
                <th className={`py-2 pr-4 ${adminTableHeaderClass}`}>Role</th>
                <th className={`py-2 pr-4 ${adminTableHeaderClass}`}>Created</th>
                <th className={`py-2 text-right ${adminTableHeaderClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 font-normal text-zinc-800 dark:text-zinc-100">
                    {user.email}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        void updateRole(user.id, event.target.value as "user" | "admin")
                      }
                      disabled={savingId === user.id}
                      className={`${adminFormControlClass} w-auto min-w-[6rem] px-2 py-1.5`}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4 font-normal text-zinc-600 dark:text-zinc-400">
                    {user.created_at ? new Date(user.created_at).toLocaleString() : "Unknown"}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteUser(user.id)}
                      disabled={savingId === user.id}
                      className="rounded-md bg-red-600 px-3 py-2 text-base font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
