"use client";

import { useEffect, useMemo, useState } from "react";
import { TrafficDashboardMap } from "@/features/dashboard/components/TrafficDashboardMap";
import { useTraffic } from "@/hooks/useTraffic";
import type { TrafficEvent } from "@/types/supabase";

type Coordinates = {
  lat: number;
  lng: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function filterWithinRadius(events: TrafficEvent[], center: Coordinates | null, radiusKm: number) {
  if (!center) return [];
  return events.filter((event) => {
    const eventPoint = { lat: event.location_lat, lng: event.location_lng };
    return distanceKm(center, eventPoint) <= radiusKm;
  });
}

export function UserTrafficDashboard() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [center, setCenter] = useState<Coordinates | null>(null);
  const [focusCoordinates, setFocusCoordinates] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const { alertCenterEvents, loading, error, fetchNearbyActivities } = useTraffic();

  useEffect(() => {
    if (!center) return;
    void fetchNearbyActivities(center.lat, center.lng, radiusKm);
  }, [center, fetchNearbyActivities, radiusKm]);

  const visibleMarkers = useMemo(
    () => filterWithinRadius(alertCenterEvents, center, radiusKm),
    [alertCenterEvents, center, radiusKm],
  );

  function useCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(nextCenter);
        setFocusCoordinates(nextCenter);
        setLocating(false);
      },
      (positionError) => {
        setGeoError(positionError.message || "Unable to fetch current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Smart Traffic Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Click on the map to set center point, adjust radius, and monitor live traffic activity.
        </p>
      </div>

      <div className="relative h-[calc(100vh-14rem)] min-h-[36rem]">
        <TrafficDashboardMap
          center={center}
          focusCoordinates={focusCoordinates}
          radiusKm={radiusKm}
          markers={visibleMarkers}
          onCenterChange={(coordinates) => {
            setCenter(coordinates);
            setFocusCoordinates(coordinates);
          }}
        />

        <section className="absolute left-4 top-4 z-[500] w-80 space-y-3 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/95">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {locating ? "Locating..." : "Use current location"}
          </button>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Radius: {radiusKm} km
            </label>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div className="rounded-md bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {center
              ? `Center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`
              : "No center selected yet. Click map or use current location."}
          </div>

          <div className="rounded-md bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            Showing {visibleMarkers.length} live incidents in radius.
          </div>

          {loading ? <p className="text-xs text-zinc-500">Loading activities...</p> : null}
          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          {geoError ? <p className="text-xs text-red-600 dark:text-red-400">{geoError}</p> : null}
        </section>
      </div>
    </div>
  );
}
