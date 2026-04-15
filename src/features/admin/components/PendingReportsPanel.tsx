"use client";

import type { TrafficEvent } from "@/types/supabase";

type PendingReportsPanelProps = {
  pendingEvents: TrafficEvent[];
  approvedEvents: TrafficEvent[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function getTypeBadgeClass(type: TrafficEvent["type"]) {
  if (type === "accident") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pending Reports</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Review incoming reports and publish only verified incidents.
      </p>

      {loading ? <p className="mt-4 text-sm text-zinc-500">Loading pending reports...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {!loading && !error && pendingEvents.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No pending reports right now.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {pendingEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadgeClass(event.type)}`}
                >
                  {event.type ?? "unknown"}
                </span>
                <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
                  {event.description ?? "No description provided."}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Lat/Lng: {event.location_lat.toFixed(5)}, {event.location_lng.toFixed(5)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Reported: {event.created_at ? new Date(event.created_at).toLocaleString() : "Unknown"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onApprove(event.id)}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(event.id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Recently Approved</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Approved incidents remain visible here for audit and tracking.
        </p>

        {approvedEvents.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No approved incidents yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {approvedEvents.slice(0, 20).map((event) => (
              <article
                key={event.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadgeClass(event.type)}`}
                >
                  {event.type ?? "unknown"}
                </span>
                <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
                  {event.description ?? "No description provided."}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Lat/Lng: {event.location_lat.toFixed(5)}, {event.location_lng.toFixed(5)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Approved/Reported: {event.created_at ? new Date(event.created_at).toLocaleString() : "Unknown"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
