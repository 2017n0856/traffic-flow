"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  createTrafficEventsRealtimeChannel,
  fetchActivitiesInRadius,
} from "@/services/client/traffic-events";
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
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const removeChannelRef = useRef<(() => Promise<"ok" | "timed out" | "error">) | null>(null);

  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyActivities = useCallback(
    async (lat: number, lng: number, radiusKm: number) => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await fetchActivitiesInRadius(lat, lng, radiusKm);

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

    const { channel, remove } = createTrafficEventsRealtimeChannel({
      onInsert: (incoming) => {
        setEvents((current) => upsertById(current, incoming));
      },
      onUpdate: (incoming) => {
        setEvents((current) => upsertById(current, incoming));
      },
    });

    subscriptionRef.current = channel;
    removeChannelRef.current = remove;
    return channel;
  }, []);

  useEffect(() => {
    const channel = subscribeToTraffic();

    return () => {
      if (channel && removeChannelRef.current) void removeChannelRef.current();
      subscriptionRef.current = null;
      removeChannelRef.current = null;
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
