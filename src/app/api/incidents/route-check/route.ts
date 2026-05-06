import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type { TrafficEvent } from "@/types/supabase";

type RouteCheckBody = {
  from?: string;
  to?: string;
  bufferMeters?: number;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type GeoJsonLineString = {
  type: "LineString";
  coordinates: Array<[number, number]>;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseCoordinatesInput(value: string): Coordinates | null {
  const [latText, lngText] = value.split(",").map((segment) => segment.trim());
  if (!latText || !lngText) return null;
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function geocodeTextPlace(query: string): Promise<Coordinates | null> {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "traffic-flow-route-check/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = results[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function resolveInputToCoordinates(value: string): Promise<Coordinates | null> {
  const direct = parseCoordinatesInput(value);
  if (direct) return direct;
  return geocodeTextPlace(value);
}

async function fetchStreetRoute(from: Coordinates, to: Coordinates): Promise<GeoJsonLineString | null> {
  const endpoint = new URL(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
  );
  endpoint.searchParams.set("overview", "full");
  endpoint.searchParams.set("geometries", "geojson");
  endpoint.searchParams.set("alternatives", "false");

  const response = await fetch(endpoint);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    routes?: Array<{ geometry?: { type?: string; coordinates?: Array<[number, number]> } }>;
  };
  const geometry = payload.routes?.[0]?.geometry;
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) return null;
  if (geometry.coordinates.length < 2) return null;
  return { type: "LineString", coordinates: geometry.coordinates };
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

    const body = (await request.json()) as RouteCheckBody;
    const fromText = body.from?.trim() ?? "";
    const toText = body.to?.trim() ?? "";
    const bufferMeters = isFiniteNumber(body.bufferMeters) ? body.bufferMeters : 20;

    if (!fromText || !toText) {
      return NextResponse.json(
        { error: "from and to are required." },
        { status: 400 },
      );
    }

    const fromCoordinates = await resolveInputToCoordinates(fromText);
    const toCoordinates = await resolveInputToCoordinates(toText);

    if (!fromCoordinates || !toCoordinates) {
      return NextResponse.json(
        { error: "Could not resolve From/To location. Use a clearer place name or lat,lng." },
        { status: 400 },
      );
    }

    if (bufferMeters <= 0 || bufferMeters > 1000) {
      return NextResponse.json({ error: "bufferMeters must be between 1 and 1000." }, { status: 400 });
    }

    const routeGeometry = await fetchStreetRoute(fromCoordinates, toCoordinates);
    if (!routeGeometry) {
      return NextResponse.json(
        { error: "Could not build a drivable street route between From and To." },
        { status: 400 },
      );
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin.rpc("get_incidents_on_path", {
      route_geojson: routeGeometry,
      buffer_meters: bufferMeters,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bufferMeters,
      from: fromCoordinates,
      to: toCoordinates,
      route: routeGeometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      incidents: (data ?? []) as TrafficEvent[],
      count: (data ?? []).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check route incidents." },
      { status: 500 },
    );
  }
}
