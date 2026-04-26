import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type { TrafficEvent } from "@/types/supabase";

type ReportIncidentBody = {
  type?: TrafficEvent["type"];
  description?: string | null;
  locationLat?: number;
  locationLng?: number;
  defaultStatus?: "pending" | "approved";
};

const AUTO_APPROVAL_RADIUS_METERS = 50;

function distanceInMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const earthRadiusMeters = 6371000;
  const latDeltaRad = ((b.lat - a.lat) * Math.PI) / 180;
  const lngDeltaRad = ((b.lng - a.lng) * Math.PI) / 180;
  const aLatRad = (a.lat * Math.PI) / 180;
  const bLatRad = (b.lat * Math.PI) / 180;

  const haversine =
    Math.sin(latDeltaRad / 2) * Math.sin(latDeltaRad / 2) +
    Math.cos(aLatRad) * Math.cos(bLatRad) * Math.sin(lngDeltaRad / 2) * Math.sin(lngDeltaRad / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ReportIncidentBody;
    const { type, description, locationLat, locationLng } = body;
    const defaultStatus = body.defaultStatus ?? "pending";

    if (!type || !["accident", "closure", "congestion"].includes(type)) {
      return NextResponse.json({ error: "Invalid incident type." }, { status: 400 });
    }
    if (typeof locationLat !== "number" || typeof locationLng !== "number") {
      return NextResponse.json({ error: "Invalid incident coordinates." }, { status: 400 });
    }
    if (!["pending", "approved"].includes(defaultStatus)) {
      return NextResponse.json({ error: "Invalid incident status." }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    let resolvedStatus: "pending" | "approved" = defaultStatus;

    if (defaultStatus === "pending") {
      const { data: existingIncidents, error: nearbyError } = await admin
        .from("traffic_events")
        .select("id, status, location_lat, location_lng")
        .eq("type", type)
        .eq("is_predicted", false)
        .in("status", ["pending", "approved"]);

      if (nearbyError) {
        return NextResponse.json({ error: nearbyError.message }, { status: 500 });
      }

      const nearbyIncidents = ((existingIncidents ?? []) as TrafficEvent[]).filter((incident) => {
        const incidentLocation = { lat: incident.location_lat, lng: incident.location_lng };
        return (
          distanceInMeters(
            { lat: locationLat, lng: locationLng },
            incidentLocation,
          ) <= AUTO_APPROVAL_RADIUS_METERS
        );
      });

      if (nearbyIncidents.length >= 3) {
        resolvedStatus = "approved";
        const pendingNearbyIds = nearbyIncidents
          .filter((incident) => incident.status === "pending")
          .map((incident) => incident.id);

        if (pendingNearbyIds.length > 0) {
          const { error: bulkApproveError } = await admin
            .from("traffic_events")
            .update({ status: "approved" })
            .in("id", pendingNearbyIds);

          if (bulkApproveError) {
            return NextResponse.json({ error: bulkApproveError.message }, { status: 500 });
          }
        }
      }
    }

    const { data: inserted, error: insertError } = await admin
      .from("traffic_events")
      .insert({
        type,
        description: description?.trim() || null,
        status: resolvedStatus,
        is_predicted: false,
        location_lat: locationLat,
        location_lng: locationLng,
        reported_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      id: inserted.id,
      status: resolvedStatus,
      autoApproved: defaultStatus === "pending" && resolvedStatus === "approved",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit incident." },
      { status: 500 },
    );
  }
}
