"use client";

import { UserManagementPanel } from "@/features/admin/components/UserManagementPanel";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { adminBodyMutedClass, adminPageTitleClass } from "@/lib/ui/form";

export default function AdminUsersPage() {
  const { users, currentUserId, loading, error, refresh } = useAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={adminPageTitleClass}>User Management</h1>
          <p className={`mt-1 ${adminBodyMutedClass}`}>
            Manage account roles and remove suspicious users.
          </p>
        </div>
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
