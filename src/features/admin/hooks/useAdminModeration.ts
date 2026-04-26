"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  approveTrafficEvent,
  createAdminModerationRealtimeChannel,
  deleteTrafficEvent,
  fetchModerationEvents,
} from "@/services/client/traffic-events";
import type { TrafficEvent } from "@/types/supabase";

function upsertEvent(current: TrafficEvent[], incoming: TrafficEvent) {
  const index = current.findIndex((item) => item.id === incoming.id);
  if (index === -1) return [incoming, ...current];
  const next = [...current];
  next[index] = incoming;
  return next;
}

export function useAdminModeration() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const removeChannelRef = useRef<(() => Promise<"ok" | "timed out" | "error">) | null>(null);
  const [pendingEvents, setPendingEvents] = useState<TrafficEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await fetchModerationEvents();

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as TrafficEvent[];
    setPendingEvents(rows.filter((event) => event.status === "pending"));
    setApprovedEvents(rows.filter((event) => event.status === "approved"));
    setLoading(false);
  }, []);

  const approveEvent = useCallback(async (id: string) => {
    const { error: updateError } = await approveTrafficEvent(id);

    if (updateError) throw updateError;
    setPendingEvents((current) => {
      const approved = current.find((event) => event.id === id);
      if (approved) {
        setApprovedEvents((existing) =>
          upsertEvent(existing, { ...approved, status: "approved" }),
        );
      }
      return current.filter((event) => event.id !== id);
    });
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const { error: deleteError } = await deleteTrafficEvent(id);

    if (deleteError) throw deleteError;
    setPendingEvents((current) => current.filter((event) => event.id !== id));
    setApprovedEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadEvents();
    });
  }, [loadEvents]);

  useEffect(() => {
    const { channel, remove } = createAdminModerationRealtimeChannel({
      onInsert: (incoming) => {
        if (incoming.status === "pending") {
          setPendingEvents((current) => upsertEvent(current, incoming));
        }
        if (incoming.status === "approved") {
          setApprovedEvents((current) => upsertEvent(current, incoming));
        }
      },
      onUpdate: (incoming) => {
        if (incoming.status === "pending") {
          setPendingEvents((current) => upsertEvent(current, incoming));
          setApprovedEvents((current) => current.filter((event) => event.id !== incoming.id));
          return;
        }
        if (incoming.status === "approved") {
          setApprovedEvents((current) => upsertEvent(current, incoming));
          setPendingEvents((current) => current.filter((event) => event.id !== incoming.id));
          return;
        }
        setPendingEvents((current) => current.filter((event) => event.id !== incoming.id));
        setApprovedEvents((current) => current.filter((event) => event.id !== incoming.id));
      },
      onDelete: (deletedId) => {
        setPendingEvents((current) => current.filter((event) => event.id !== deletedId));
        setApprovedEvents((current) => current.filter((event) => event.id !== deletedId));
      },
    });

    channelRef.current = channel;
    removeChannelRef.current = remove;

    return () => {
      if (channelRef.current && removeChannelRef.current) void removeChannelRef.current();
      channelRef.current = null;
      removeChannelRef.current = null;
    };
  }, []);

  const stats = useMemo(
    () => {
      const allEvents = [...pendingEvents, ...approvedEvents];
      return {
        pendingCount: pendingEvents.length,
        approvedCount: approvedEvents.length,
        accidentCount: allEvents.filter((event) => event.type === "accident").length,
        closureCount: allEvents.filter((event) => event.type === "closure").length,
        congestionCount: allEvents.filter((event) => event.type === "congestion").length,
      };
    },
    [approvedEvents, pendingEvents],
  );

  return { pendingEvents, approvedEvents, stats, loading, error, loadEvents, approveEvent, deleteEvent };
}
