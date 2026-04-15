"use client";

import { useEffect, useMemo, useState } from "react";
import { TrafficDashboardMap } from "@/features/dashboard/components/TrafficDashboardMap";
import { useTraffic } from "@/hooks/useTraffic";
import type { TrafficEvent } from "@/types/supabase";

type Coordinates = {
  lat: number;
  lng: number;
};

type EventTypeFilter = "all" | "accident" | "closure" | "congestion";
type TimeFilter = "30m" | "1h" | "4h" | "1d" | "all";

const timeFilterOptions: Array<{ value: TimeFilter; label: string; ms: number | null }> = [
  { value: "30m", label: "Last 30 min", ms: 30 * 60 * 1000 },
  { value: "1h", label: "Last 1 hour", ms: 60 * 60 * 1000 },
  { value: "4h", label: "Last 4 hours", ms: 4 * 60 * 60 * 1000 },
  { value: "1d", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { value: "all", label: "All time", ms: null },
];

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

function matchesEventType(event: TrafficEvent, filter: EventTypeFilter) {
  if (filter === "all") return true;
  return event.type === filter;
}

function matchesReportTime(event: TrafficEvent, filter: TimeFilter) {
  const selected = timeFilterOptions.find((option) => option.value === filter);
  if (!selected || selected.ms === null) return true;
  if (!event.created_at) return false;
  const eventTime = new Date(event.created_at).getTime();
  if (Number.isNaN(eventTime)) return false;
  return Date.now() - eventTime <= selected.ms;
}

export function UserTrafficDashboard() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("1h");
  const [center, setCenter] = useState<Coordinates | null>(null);
  const [focusCoordinates, setFocusCoordinates] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const { alertCenterEvents, loading, error, fetchNearbyActivities } = useTraffic();

  useEffect(() => {
    if (!center) return;
    void fetchNearbyActivities(center.lat, center.lng, radiusKm);
  }, [center, fetchNearbyActivities, radiusKm]);

  const filteredEvents = useMemo(
    () =>
      filterWithinRadius(alertCenterEvents, center, radiusKm).filter(
        (event) =>
          matchesEventType(event, eventTypeFilter) && matchesReportTime(event, timeFilter),
      ),
    [alertCenterEvents, center, eventTypeFilter, radiusKm, timeFilter],
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
          Click on the map to set center point, apply filters, and monitor live traffic activity.
        </p>
      </div>

      <div className="relative h-[calc(100vh-14rem)] min-h-[36rem]">
        <TrafficDashboardMap
          center={center}
          focusCoordinates={focusCoordinates}
          radiusKm={radiusKm}
          markers={filteredEvents}
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

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Event type
            </span>
            <select
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="all">All events</option>
              <option value="accident">Accidents</option>
              <option value="closure">Closures</option>
              <option value="congestion">Congestion</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Report time
            </span>
            <select
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {timeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-md bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {center
              ? `Center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`
              : "No center selected yet. Click map or use current location."}
          </div>

          <div className="rounded-md bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            Showing {filteredEvents.length} incidents after radius + filter match.
          </div>

          {loading ? <p className="text-xs text-zinc-500">Loading activities...</p> : null}
          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          {geoError ? <p className="text-xs text-red-600 dark:text-red-400">{geoError}</p> : null}
        </section>

        <section className="absolute bottom-4 right-4 top-4 z-[500] w-[22rem] rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/95">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Incident Feed
            </h2>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              {filteredEvents.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Chronological alerts (newest first)
          </p>

          <div className="mt-3 h-[calc(100%-3.5rem)] space-y-2 overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                No incidents match selected filters.
              </div>
            ) : (
              filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      {event.type ?? "incident"}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Unknown"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                    {event.description ?? "No description provided."}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {event.location_lat.toFixed(5)}, {event.location_lng.toFixed(5)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
