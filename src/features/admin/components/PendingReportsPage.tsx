"use client";

import Link from "next/link";
import { PendingReportsPanel } from "@/features/admin/components/PendingReportsPanel";
import { useAdminModeration } from "@/features/admin/hooks/useAdminModeration";

export function PendingReportsPage() {
  const { pendingEvents, approvedEvents, stats, loading, error, approveEvent, deleteEvent } =
    useAdminModeration();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pending Reports Approval
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review and approve reports before they are visible to users.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Back to incident report
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.pendingCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Accidents</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.accidentCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Closures</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.closureCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Congestion</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.congestionCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
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
