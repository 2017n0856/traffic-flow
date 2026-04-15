"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TrafficEvent } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

function upsertEvent(current: TrafficEvent[], incoming: TrafficEvent) {
  const index = current.findIndex((item) => item.id === incoming.id);
  if (index === -1) return [incoming, ...current];
  const next = [...current];
  next[index] = incoming;
  return next;
}

export function useAdminModeration() {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [pendingEvents, setPendingEvents] = useState<TrafficEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabaseRef.current
      .from("traffic_events")
      .select("*")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

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
    const { error: updateError } = await supabaseRef.current
      .from("traffic_events")
      .update({ status: "approved" })
      .eq("id", id);

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
    const { error: deleteError } = await supabaseRef.current
      .from("traffic_events")
      .delete()
      .eq("id", id);

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
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-pending-traffic-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_events" },
        (payload) => {
          const incoming = payload.new as TrafficEvent;
          if (incoming.status === "pending") {
            setPendingEvents((current) => upsertEvent(current, incoming));
          }
          if (incoming.status === "approved") {
            setApprovedEvents((current) => upsertEvent(current, incoming));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "traffic_events" },
        (payload) => {
          const incoming = payload.new as TrafficEvent;
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
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "traffic_events" },
        (payload) => {
          const deletedId = String(payload.old.id);
          setPendingEvents((current) => current.filter((event) => event.id !== deletedId));
          setApprovedEvents((current) => current.filter((event) => event.id !== deletedId));
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
      channelRef.current = null;
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
