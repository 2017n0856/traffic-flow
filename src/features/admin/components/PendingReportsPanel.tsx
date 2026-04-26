"use client";

import type { TrafficEvent } from "@/types/supabase";
import {
  adminBodyMutedClass,
  adminFormFieldErrorClass,
  adminPanelTitleClass,
  adminSectionTitleClass,
} from "@/lib/ui/form";

type PendingReportsPanelProps = {
  pendingEvents: TrafficEvent[];
  approvedEvents: TrafficEvent[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function getTypeBadgeClass(type: TrafficEvent["type"]) {
  if (type === "accident")
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  if (type === "closure")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
}

export function PendingReportsPanel({
  pendingEvents = [],
  approvedEvents = [],
  loading,
  error,
  onApprove,
  onDelete,
}: PendingReportsPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className={adminSectionTitleClass}>Pending Reports</h2>
      <p className={`mt-1 ${adminBodyMutedClass}`}>
        Review incoming reports and publish only verified incidents.
      </p>

      {loading ? (
        <p className="mt-4 text-base font-normal text-zinc-500">
          Loading pending reports...
        </p>
      ) : null}
      {error ? <p className={`mt-4 ${adminFormFieldErrorClass}`}>{error}</p> : null}

      {!loading && !error && pendingEvents.length === 0 ? (
        <p className={`mt-4 ${adminBodyMutedClass}`}>
          No pending reports right now.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {pendingEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-sm font-semibold ${getTypeBadgeClass(event.type)}`}
                >
                  {event.type ?? "unknown"}
                </span>
                <p className="mt-2 text-base font-normal leading-snug text-zinc-900 dark:text-zinc-100">
                  {event.description ?? "No description provided."}
                </p>
                <p className="mt-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  Lat/Lng: {event.location_lat.toFixed(5)},{" "}
                  {event.location_lng.toFixed(5)}
                </p>
                <p className="mt-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  Reported:{" "}
                  {event.created_at
                    ? new Date(event.created_at).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => void onApprove(event.id)}
                  className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-base font-medium text-white hover:bg-emerald-500 sm:flex-none"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(event.id)}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-base font-medium text-white hover:bg-red-500 sm:flex-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <h3 className={adminPanelTitleClass}>Recently Approved</h3>
        <p className={`mt-1 ${adminBodyMutedClass}`}>
          Approved incidents remain visible here for audit and tracking.
        </p>

        {approvedEvents.length === 0 ? (
          <p className={`mt-4 ${adminBodyMutedClass}`}>No approved incidents yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {approvedEvents.slice(0, 20).map((event) => (
              <article
                key={event.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-sm font-semibold ${getTypeBadgeClass(event.type)}`}
                >
                  {event.type ?? "unknown"}
                </span>
                <p className="mt-2 text-base font-normal leading-snug text-zinc-900 dark:text-zinc-100">
                  {event.description ?? "No description provided."}
                </p>
                <p className="mt-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  Lat/Lng: {event.location_lat.toFixed(5)},{" "}
                  {event.location_lng.toFixed(5)}
                </p>
                <p className="mt-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  Approved/Reported:{" "}
                  {event.created_at
                    ? new Date(event.created_at).toLocaleString()
                    : "Unknown"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
