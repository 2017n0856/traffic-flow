"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import type { TrafficEvent } from "@/types/supabase";

function isApprovedEvent(event: TrafficEvent) {
  return event.status === "approved" || Boolean(event.is_predicted);
}

function upsertById(current: TrafficEvent[], incoming: TrafficEvent) {
  const index = current.findIndex((item) => item.id === incoming.id);
  if (index === -1) return [incoming, ...current];

  const next = [...current];
  next[index] = incoming;
  return next;
}

export function useTraffic() {
  const supabaseRef = useRef(createClient());
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyActivities = useCallback(
    async (lat: number, lng: number, radiusKm: number) => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabaseRef.current.rpc(
        "get_activities_in_radius",
        {
          user_lat: lat,
          user_lng: lng,
          radius_km: radiusKm,
        },
      );

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return [];
      }

      const nextEvents: TrafficEvent[] = (data ?? []) as TrafficEvent[];
      setEvents(nextEvents);
      setLoading(false);
      return nextEvents;
    },
    [],
  );

  const subscribeToTraffic = useCallback(() => {
    if (subscriptionRef.current) return subscriptionRef.current;

    const channel = supabaseRef.current
      .channel("traffic-events-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traffic_events" },
        (payload) => {
          const incoming = payload.new as TrafficEvent;
          setEvents((current) => upsertById(current, incoming));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "traffic_events" },
        (payload) => {
          const incoming = payload.new as TrafficEvent;
          setEvents((current) => upsertById(current, incoming));
        },
      )
      .subscribe();

    subscriptionRef.current = channel;
    return channel;
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = subscribeToTraffic();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
      subscriptionRef.current = null;
    };
  }, [subscribeToTraffic]);

  const mapMarkers = useMemo(() => events, [events]);
  const alertCenterEvents = useMemo(
    () =>
      events
        .filter(isApprovedEvent)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [events],
  );

  return {
    events,
    mapMarkers,
    alertCenterEvents,
    loading,
    error,
    fetchNearbyActivities,
    subscribeToTraffic,
  };
}
