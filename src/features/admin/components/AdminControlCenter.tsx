"use client";

import Link from "next/link";
import { IncidentReportForm } from "@/features/admin/components/IncidentReportForm";

export function AdminControlCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Incident Report
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage operations, open moderation queues, and submit incidents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/reports"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Pending Reports
          </Link>
          <Link
            href="/admin/users"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            User Management
          </Link>
        </div>
      </div>

      <IncidentReportForm />
    </div>
  );
}
