"use client";

import Link from "next/link";
import { UserManagementPanel } from "@/features/admin/components/UserManagementPanel";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";

export default function AdminUsersPage() {
  const { users, currentUserId, loading, error, refresh } = useAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            User Management
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage account roles and remove suspicious users.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Back to incident report
        </Link>
      </div>

      <UserManagementPanel
        users={users}
        currentUserId={currentUserId}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
    </div>
  );
}
