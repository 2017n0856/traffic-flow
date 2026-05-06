"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TrafficEvent } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

export async function fetchModerationEvents() {
  const supabase = createClient();
  return supabase
    .from("traffic_events")
    .select("*")
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });
}

export async function approveTrafficEvent(id: string) {
  const supabase = createClient();
  return supabase.from("traffic_events").update({ status: "approved" }).eq("id", id);
}

export async function deleteTrafficEvent(id: string) {
  const supabase = createClient();
  return supabase.from("traffic_events").delete().eq("id", id);
}

export async function fetchActivitiesInRadius(lat: number, lng: number, radiusKm: number) {
  const supabase = createClient();
  return supabase.rpc("get_activities_in_radius", {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  });
}

type CheckRouteIncidentsParams = {
  from: string;
  to: string;
  bufferMeters?: number;
};

type RouteCoordinates = {
  lat: number;
  lng: number;
};

type CheckRouteIncidentsResponse = {
  count: number;
  bufferMeters: number;
  from?: RouteCoordinates;
  to?: RouteCoordinates;
  route?: RouteCoordinates[];
  incidents: TrafficEvent[];
  error?: string;
};

export async function checkRouteIncidents(params: CheckRouteIncidentsParams) {
  const response = await fetch("/api/incidents/route-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const body = (await response.json()) as CheckRouteIncidentsResponse;
  return { response, body };
}

export function createTrafficEventsRealtimeChannel(handlers: {
  onInsert: (incoming: TrafficEvent) => void;
  onUpdate: (incoming: TrafficEvent) => void;
}): { channel: RealtimeChannel; remove: () => Promise<"ok" | "timed out" | "error"> } {
  const supabase = createClient();
  const channel = supabase
    .channel("traffic-events-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "traffic_events" },
      (payload) => handlers.onInsert(payload.new as TrafficEvent),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "traffic_events" },
      (payload) => handlers.onUpdate(payload.new as TrafficEvent),
    )
    .subscribe();

  return {
    channel,
    remove: () => supabase.removeChannel(channel),
  };
}

export function createAdminModerationRealtimeChannel(handlers: {
  onInsert: (incoming: TrafficEvent) => void;
  onUpdate: (incoming: TrafficEvent) => void;
  onDelete: (deletedId: string) => void;
}): { channel: RealtimeChannel; remove: () => Promise<"ok" | "timed out" | "error"> } {
  const supabase = createClient();
  const channel = supabase
    .channel("admin-pending-traffic-events")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "traffic_events" },
      (payload) => handlers.onInsert(payload.new as TrafficEvent),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "traffic_events" },
      (payload) => handlers.onUpdate(payload.new as TrafficEvent),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "traffic_events" },
      (payload) => handlers.onDelete(String(payload.old.id)),
    )
    .subscribe();

  return {
    channel,
    remove: () => supabase.removeChannel(channel),
  };
}

export function createUserTrafficToastChannel(params: {
  userId: string;
  onInsertApproved: (incoming: TrafficEvent) => void;
  onUpdateToApproved: (incoming: TrafficEvent, previous: Partial<TrafficEvent>) => void;
}): { channel: RealtimeChannel; remove: () => Promise<"ok" | "timed out" | "error"> } {
  const supabase = createClient();
  const channelName = `user-traffic-toast-events-${params.userId}-${crypto.randomUUID()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "traffic_events" },
      (payload) => {
        const incoming = payload.new as TrafficEvent;
        if (incoming.status === "approved") {
          params.onInsertApproved(incoming);
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
          params.onUpdateToApproved(incoming, previous);
        }
      },
    )
    .subscribe();

  return {
    channel,
    remove: () => supabase.removeChannel(channel),
  };
}
