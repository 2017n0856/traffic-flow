"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TrafficEvent } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

type ToastItem = {
  id: string;
  message: string;
};

function buildToastMessage(eventType: TrafficEvent["type"]) {
  const label = eventType ?? "incident";
  return `new ${label} reported`;
}

export function TrafficRealtimeToasts() {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    let isCancelled = false;

    function pushToast(message: string) {
      const id = crypto.randomUUID();
      setToasts((current) => [{ id, message }, ...current].slice(0, 4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4500);
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || isCancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: "admin" | "user" | null }>();

      // Only user-facing experience should receive these realtime toasts.
      if (profile?.role === "admin" || isCancelled) return;

      const channelName = `user-traffic-toast-events-${user.id}-${crypto.randomUUID()}`;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "traffic_events" },
          (payload) => {
            const incoming = payload.new as TrafficEvent;
            if (incoming.status === "approved") {
              pushToast(buildToastMessage(incoming.type));
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "traffic_events" },
          (payload) => {
            const incoming = payload.new as TrafficEvent;
            const previous = payload.old as Partial<TrafficEvent>;
            if (incoming.status === "approved" && previous.status !== "approved") {
              pushToast(buildToastMessage(incoming.type));
            }
          },
        )
        .subscribe();

      if (isCancelled) {
        void supabase.removeChannel(channel);
        return;
      }

      channelRef.current = channel;
    })();

    return () => {
      isCancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
      channelRef.current = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-normal leading-snug text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
