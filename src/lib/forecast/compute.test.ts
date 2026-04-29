import { buildZoneAggregates, computeForecastRows } from "@/lib/forecast/compute";
import { FORECAST_HORIZONS } from "@/lib/forecast/horizons";
import type { TrafficEvent } from "@/types/supabase";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const now = new Date("2026-04-29T12:00:00.000Z");

const sampleEvents: TrafficEvent[] = [
  {
    id: "e1",
    created_at: "2026-04-29T11:55:00.000Z",
    type: "closure",
    description: "Road closed",
    status: "approved",
    is_predicted: false,
    location_lat: -33.8688,
    location_lng: 151.2093,
    location_point: null,
    reported_by: null,
  },
  {
    id: "e2",
    created_at: "2026-04-29T11:50:00.000Z",
    type: "congestion",
    description: "Heavy traffic",
    status: "approved",
    is_predicted: false,
    location_lat: -33.8689,
    location_lng: 151.2094,
    location_point: null,
    reported_by: null,
  },
];

export function runComputeForecastSelfTest() {
  const zones = buildZoneAggregates(sampleEvents);
  const rows = computeForecastRows({ zones, horizons: FORECAST_HORIZONS, now });

  assert(rows.length === 3, "expected one zone with 3 horizons");
  assert(rows.every((row) => row.forecast_score >= 0 && row.forecast_score <= 100), "score out of bounds");
  assert(rows.every((row) => row.confidence >= 0 && row.confidence <= 1), "confidence out of bounds");
  assert(rows.some((row) => row.horizon_minutes === 60), "missing 60m horizon");
}
