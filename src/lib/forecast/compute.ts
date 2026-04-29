import { FORECAST_HALF_LIFE_MINUTES, FORECAST_LEVEL_THRESHOLDS, type ForecastHorizon } from "@/lib/forecast/horizons";
import { getSeverityWeight } from "@/lib/forecast/severity";
import type { TrafficEvent, TrafficForecast } from "@/types/supabase";

type Coordinates = { lat: number; lng: number };

type ZoneAggregate = {
  zoneKey: string;
  center: Coordinates;
  incidents: TrafficEvent[];
};

export type ComputedForecastRow = Pick<
  TrafficForecast,
  | "zone_key"
  | "center_lat"
  | "center_lng"
  | "horizon_minutes"
  | "forecast_score"
  | "forecast_level"
  | "confidence"
  | "source"
  | "generated_at"
  | "valid_from"
  | "valid_until"
>;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function bucket(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

export function buildZoneAggregates(events: TrafficEvent[]) {
  const byZone = new Map<string, ZoneAggregate>();

  for (const event of events) {
    const zoneLat = bucket(event.location_lat);
    const zoneLng = bucket(event.location_lng);
    const zoneKey = `${zoneLat}:${zoneLng}`;

    const existing = byZone.get(zoneKey);
    if (existing) {
      existing.incidents.push(event);
      continue;
    }

    byZone.set(zoneKey, {
      zoneKey,
      center: { lat: zoneLat, lng: zoneLng },
      incidents: [event],
    });
  }

  return [...byZone.values()];
}

function timeDecay(minutesAgo: number) {
  if (minutesAgo <= 0) return 1;
  return Math.exp((-Math.log(2) * minutesAgo) / FORECAST_HALF_LIFE_MINUTES);
}

function distanceWeight(km: number) {
  if (km <= 0.7) return 1;
  if (km <= 1.5) return 0.5;
  return 0.2;
}

function scoreToLevel(score: number): "low" | "medium" | "high" {
  if (score < FORECAST_LEVEL_THRESHOLDS.lowMax) return "low";
  if (score < FORECAST_LEVEL_THRESHOLDS.mediumMax) return "medium";
  return "high";
}

function computeConfidence(incidentCount: number, averageRecencyMinutes: number) {
  const countFactor = clamp(incidentCount / 8, 0, 1);
  const recencyFactor = clamp(1 - averageRecencyMinutes / 180, 0, 1);
  return Number((0.65 * countFactor + 0.35 * recencyFactor).toFixed(2));
}

export function computeForecastRows(params: {
  zones: ZoneAggregate[];
  horizons: readonly ForecastHorizon[];
  now?: Date;
}) {
  const nowDate = params.now ?? new Date();

  return params.zones.flatMap((zone) => {
    const incidentContributions = zone.incidents.map((event) => {
      const createdAtMs = event.created_at ? new Date(event.created_at).getTime() : nowDate.getTime();
      const minutesAgo = Math.max(0, (nowDate.getTime() - createdAtMs) / 60000);
      const dist = distanceKm(zone.center, { lat: event.location_lat, lng: event.location_lng });
      return {
        impact: getSeverityWeight(event.type) * timeDecay(minutesAgo) * distanceWeight(dist),
        minutesAgo,
      };
    });

    const totalImpact = incidentContributions.reduce((sum, item) => sum + item.impact, 0);
    const averageRecency =
      incidentContributions.length === 0
        ? 180
        : incidentContributions.reduce((sum, item) => sum + item.minutesAgo, 0) / incidentContributions.length;

    return params.horizons.map((horizon) => {
      const horizonScale = horizon === 15 ? 1 : horizon === 30 ? 1.15 : 1.3;
      const score = clamp(totalImpact * 28 * horizonScale, 0, 100);
      const generatedAt = nowDate.toISOString();
      const validUntil = new Date(nowDate.getTime() + horizon * 60 * 1000).toISOString();

      return {
        zone_key: zone.zoneKey,
        center_lat: zone.center.lat,
        center_lng: zone.center.lng,
        horizon_minutes: horizon,
        forecast_score: Number(score.toFixed(2)),
        forecast_level: scoreToLevel(score),
        confidence: computeConfidence(zone.incidents.length, averageRecency),
        source: "incident_rules_v1",
        generated_at: generatedAt,
        valid_from: generatedAt,
        valid_until: validUntil,
      } satisfies ComputedForecastRow;
    });
  });
}
