"use client";

import { PendingReportsPanel } from "@/features/admin/components/PendingReportsPanel";
import { useAdminModeration } from "@/features/admin/hooks/useAdminModeration";
import {
  adminBodyMutedClass,
  adminPageTitleClass,
  adminStatLabelClass,
} from "@/lib/ui/form";

export function PendingReportsPage() {
  const {
    pendingEvents,
    approvedEvents,
    stats,
    loading,
    error,
    approveEvent,
    deleteEvent,
  } = useAdminModeration();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Pending Reports Approval</h1>
          <p className={`mt-1 ${adminBodyMutedClass}`}>
            Review and approve reports before they are visible to users.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className={adminStatLabelClass}>Pending</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {stats.pendingCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className={adminStatLabelClass}>Accidents</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {stats.accidentCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className={adminStatLabelClass}>Closures</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {stats.closureCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className={adminStatLabelClass}>Congestion</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {stats.congestionCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className={adminStatLabelClass}>Approved</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {stats.approvedCount}
          </p>
        </div>
      </section>

      <PendingReportsPanel
        pendingEvents={pendingEvents}
        approvedEvents={approvedEvents}
        loading={loading}
        error={error}
        onApprove={approveEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
