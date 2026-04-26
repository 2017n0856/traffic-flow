"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getAuthUser, getUserRole } from "@/services/client/auth";
import { createUserTrafficToastChannel } from "@/services/client/traffic-events";
import type { TrafficEvent } from "@/types/supabase";

type ToastItem = {
  id: string;
  message: string;
};

function buildToastMessage(eventType: TrafficEvent["type"]) {
  const label = eventType ?? "incident";
  return `new ${label} reported`;
}

export function TrafficRealtimeToasts() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const removeChannelRef = useRef<(() => Promise<"ok" | "timed out" | "error">) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
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
      } = await getAuthUser();

      if (!user || isCancelled) return;

      const { data: profile } = await getUserRole(user.id);

      // Only user-facing experience should receive these realtime toasts.
      if (profile?.role === "admin" || isCancelled) return;

      const { channel, remove } = createUserTrafficToastChannel({
        userId: user.id,
        onInsertApproved: (incoming) => {
          pushToast(buildToastMessage(incoming.type));
        },
        onUpdateToApproved: (incoming) => {
          pushToast(buildToastMessage(incoming.type));
        },
      });

      if (isCancelled) {
        void remove();
        return;
      }

      channelRef.current = channel;
      removeChannelRef.current = remove;
    })();

    return () => {
      isCancelled = true;
      if (channelRef.current && removeChannelRef.current) void removeChannelRef.current();
      channelRef.current = null;
      removeChannelRef.current = null;
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
