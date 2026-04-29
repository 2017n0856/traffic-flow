"use client";

import type { TrafficForecast } from "@/types/supabase";

export type ForecastNearbyParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  horizonMinutes: 15 | 30 | 60;
};

export type ForecastNearbyResponse = {
  horizonMinutes: number;
  radiusKm: number;
  forecasts: TrafficForecast[];
};

export async function fetchNearbyForecasts(
  params: ForecastNearbyParams,
): Promise<ForecastNearbyResponse> {
  const searchParams = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusKm: String(params.radiusKm),
    horizonMinutes: String(params.horizonMinutes),
  });

  const response = await fetch(`/api/forecast/nearby?${searchParams.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const payload = (await response.json()) as Partial<ForecastNearbyResponse> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to fetch traffic forecast.");
  }

  return {
    horizonMinutes: payload.horizonMinutes ?? params.horizonMinutes,
    radiusKm: payload.radiusKm ?? params.radiusKm,
    forecasts: (payload.forecasts ?? []) as TrafficForecast[],
  };
}
