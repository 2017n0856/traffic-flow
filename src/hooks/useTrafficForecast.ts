"use client";

import { useCallback, useState } from "react";
import { fetchNearbyForecasts } from "@/services/client/forecast";
import type { TrafficForecast } from "@/types/supabase";

type Coordinates = { lat: number; lng: number };
export type ForecastHorizon = 15 | 30 | 60;

export function useTrafficForecast() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(30);
  const [forecasts, setForecasts] = useState<TrafficForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecasts = useCallback(
    async (center: Coordinates, radiusKm: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchNearbyForecasts({
          lat: center.lat,
          lng: center.lng,
          radiusKm,
          horizonMinutes: horizon,
        });
        setForecasts(result.forecasts);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch forecast data.");
        setForecasts([]);
      } finally {
        setLoading(false);
      }
    },
    [horizon],
  );

  return {
    horizon,
    setHorizon,
    forecasts,
    loading,
    error,
    fetchForecasts,
  };
}
