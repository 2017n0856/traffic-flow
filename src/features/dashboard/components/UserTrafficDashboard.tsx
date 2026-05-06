"use client";

import { useEffect, useMemo, useState } from "react";
import { TrafficDashboardMap } from "@/features/dashboard/components/TrafficDashboardMap";
import { useTraffic } from "@/hooks/useTraffic";
import { useTrafficForecast } from "@/hooks/useTrafficForecast";
import type { TrafficEvent } from "@/types/supabase";
import { checkRouteIncidents } from "@/services/client/traffic-events";
import {
  adminBodyMutedClass,
  adminFormControlClass,
  adminFormFieldErrorClass,
  adminFormLabelClass,
  adminPageTitleClass,
  adminPanelTitleClass,
  largeSecondaryButtonClass,
} from "@/lib/ui/form";
import { TrafficForecastPanel } from "@/features/dashboard/components/TrafficForecastPanel";

type Coordinates = {
  lat: number;
  lng: number;
};

type RouteToast = {
  id: string;
  message: string;
  tone: "ok" | "warning";
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
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [routeFrom, setRouteFrom] = useState<Coordinates | null>(null);
  const [routeTo, setRouteTo] = useState<Coordinates | null>(null);
  const [routePath, setRoutePath] = useState<Coordinates[]>([]);
  const [routeIncidents, setRouteIncidents] = useState<TrafficEvent[]>([]);
  const [routeCheckPending, setRouteCheckPending] = useState(false);
  const [routeCheckError, setRouteCheckError] = useState<string | null>(null);
  const [routeToast, setRouteToast] = useState<RouteToast | null>(null);

  const { alertCenterEvents, loading, error, fetchNearbyActivities } = useTraffic();
  const {
    horizon,
    setHorizon,
    forecasts,
    loading: forecastLoading,
    error: forecastError,
    fetchForecasts,
  } = useTrafficForecast();

  useEffect(() => {
    if (!center) return;
    void fetchNearbyActivities(center.lat, center.lng, radiusKm);
  }, [center, fetchNearbyActivities, radiusKm]);

  useEffect(() => {
    if (!center) return;
    void fetchForecasts(center, radiusKm);
  }, [center, fetchForecasts, radiusKm, horizon]);

  const filteredEvents = useMemo(
    () =>
      filterWithinRadius(alertCenterEvents, center, radiusKm).filter(
        (event) =>
          matchesEventType(event, eventTypeFilter) && matchesReportTime(event, timeFilter),
      ),
    [alertCenterEvents, center, eventTypeFilter, radiusKm, timeFilter],
  );

  useEffect(() => {
    if (!routeToast) return;
    const timeout = window.setTimeout(() => setRouteToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [routeToast]);

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

  async function onCheckRoute() {
    setRouteCheckError(null);
    const fromText = fromLocation.trim();
    const toText = toLocation.trim();

    if (!fromText || !toText) {
      setRouteCheckError("Enter both From and To locations.");
      return;
    }

    setRouteCheckPending(true);

    try {
      const { response, body } = await checkRouteIncidents({
        from: fromText,
        to: toText,
        bufferMeters: 20,
      });

      if (!response.ok) {
        setRouteCheckError(body.error ?? "Failed to check route incidents.");
        setRouteIncidents([]);
        return;
      }

      if (body.from && body.to) {
        setRouteFrom(body.from);
        setRouteTo(body.to);
        setFocusCoordinates(body.from);
      }
      setRoutePath(body.route ?? []);
      setRouteIncidents(body.incidents ?? []);

      const hasIncidents = body.count > 0;
      setRouteToast({
        id: crypto.randomUUID(),
        tone: hasIncidents ? "warning" : "ok",
        message: hasIncidents
          ? `Route has incidents (${body.count}) within 20m.`
          : "Route is clear (no incidents within 20m).",
      });
    } finally {
      setRouteCheckPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className={adminPageTitleClass}>Smart Traffic Dashboard</h1>
        <p className={`mt-1 ${adminBodyMutedClass}`}>
          Click on the map to set center point, apply filters, and monitor live traffic activity.
        </p>
      </div>

      <section className="rounded-xl border border-teal-900/50 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 p-3 shadow-[inset_-1px_0_0_rgba(13,148,136,0.2)] dark:border-teal-800/60 dark:from-[#042f2e] dark:via-[#0f2725] dark:to-[#020617] dark:shadow-[inset_-1px_0_0_rgba(45,212,191,0.08)]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (fromLocation.trim() && toLocation.trim()) {
              void onCheckRoute();
            } else {
              setRouteCheckError("Enter both From and To locations.");
            }
          }}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={fromLocation}
              onChange={(event) => setFromLocation(event.target.value)}
              placeholder="From (address/place or lat,lng)"
              className={adminFormControlClass}
            />
            <input
              type="text"
              value={toLocation}
              onChange={(event) => setToLocation(event.target.value)}
              placeholder="To (address/place or lat,lng)"
              className={adminFormControlClass}
            />
            <button
              type="submit"
              disabled={routeCheckPending}
              className={`whitespace-nowrap !text-white hover:text-white ${largeSecondaryButtonClass} disabled:opacity-60`}
            >
              {routeCheckPending ? "Checking..." : "Check route"}
            </button>
          </div>
        </form>
        {routeCheckError ? <p className={`mt-1 ${adminFormFieldErrorClass}`}>{routeCheckError}</p> : null}
      </section>

      <div className="relative h-[52vh] min-h-[20rem] lg:h-[calc(100vh-14rem)] lg:min-h-[36rem]">

        <TrafficDashboardMap
          center={center}
          focusCoordinates={focusCoordinates}
          radiusKm={radiusKm}
          markers={filteredEvents}
          forecasts={forecasts}
          routeFrom={routeFrom}
          routeTo={routeTo}
          routePath={routePath}
          routeIncidents={routeIncidents}
          onCenterChange={(coordinates) => {
            setCenter(coordinates);
            setFocusCoordinates(coordinates);
          }}
        />

        {routeToast ? (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[800] -translate-x-1/2">
            <div
              className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
                routeToast.tone === "warning"
                  ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
              }`}
            >
              {routeToast.message}
            </div>
          </div>
        ) : null}

        <section className="group z-[500] mt-4 w-full space-y-3 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:mt-0 lg:w-14 lg:overflow-hidden lg:p-3 lg:transition-all lg:duration-200 lg:hover:w-80 lg:hover:p-4 dark:border-zinc-700 dark:bg-zinc-950/95">
          <div className="hidden h-full flex-col items-center justify-between py-2 lg:flex lg:group-hover:hidden">
            <span className="rotate-180 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 [writing-mode:vertical-rl] dark:text-zinc-400">
              Filters
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-sm font-semibold tabular-nums text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {filteredEvents.length}
            </span>
          </div>

          <div className="mt-0 lg:pointer-events-none lg:absolute lg:inset-0 lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:p-4">
            <div className="space-y-3 lg:h-full lg:overflow-y-auto lg:pr-1">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className={`w-full ${largeSecondaryButtonClass} disabled:opacity-60`}
              >
                {locating ? "Locating..." : "Use current location"}
              </button>

              <div>
                <label className={adminFormLabelClass}>Radius: {radiusKm} km</label>
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

              <label className="block text-base">
                <span className={`mb-1 block ${adminFormLabelClass}`}>Event type</span>
                <select
                  value={eventTypeFilter}
                  onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
                  className={adminFormControlClass}
                >
                  <option value="all">All events</option>
                  <option value="accident">Accidents</option>
                  <option value="closure">Closures</option>
                  <option value="congestion">Congestion</option>
                </select>
              </label>

              <label className="block text-base">
                <span className={`mb-1 block ${adminFormLabelClass}`}>Report time</span>
                <select
                  value={timeFilter}
                  onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                  className={adminFormControlClass}
                >
                  {timeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-md bg-zinc-100 p-2 text-sm font-normal leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {center
                  ? `Center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`
                  : "No center selected yet. Click map or use current location."}
              </div>

              <div className="rounded-md bg-zinc-100 p-2 text-sm font-normal leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                Showing {filteredEvents.length} incidents after radius + filter match.
              </div>

              <TrafficForecastPanel
                horizon={horizon}
                onHorizonChange={setHorizon}
                forecasts={forecasts}
                loading={forecastLoading}
                error={forecastError}
              />

              {loading ? (
                <p className="text-base font-normal text-zinc-500">Loading activities...</p>
              ) : null}
              {error ? <p className={adminFormFieldErrorClass}>{error}</p> : null}
              {geoError ? <p className={adminFormFieldErrorClass}>{geoError}</p> : null}
            </div>
          </div>
        </section>

        <section className="group z-[500] mt-4 w-full rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur lg:absolute lg:bottom-4 lg:right-4 lg:top-4 lg:mt-0 lg:w-14 lg:overflow-hidden lg:p-3 lg:transition-all lg:duration-200 lg:hover:w-[22rem] lg:hover:p-4 dark:border-zinc-700 dark:bg-zinc-950/95">
          <div className="hidden h-full flex-col items-center justify-between py-2 lg:flex lg:group-hover:hidden">
            <span className="rotate-180 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 [writing-mode:vertical-rl] dark:text-zinc-400">
              Feed
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-sm font-semibold tabular-nums text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {filteredEvents.length}
            </span>
          </div>

          <div className="mt-0 lg:pointer-events-none lg:absolute lg:inset-0 lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100">
            <div className="h-full p-0 lg:p-4">
              <div className="flex items-center justify-between">
                <h2 className={adminPanelTitleClass}>Incident Feed</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-sm font-semibold tabular-nums text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  {filteredEvents.length}
                </span>
              </div>
              <p className={`mt-1 ${adminBodyMutedClass}`}>Chronological alerts (newest first)</p>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1 lg:h-[calc(100%-3.5rem)] lg:max-h-none">
                {filteredEvents.length === 0 ? (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-base font-normal text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    No incidents match selected filters.
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-sm font-semibold capitalize text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                          {event.type ?? "incident"}
                        </span>
                        <span className="text-sm font-normal tabular-nums text-zinc-500 dark:text-zinc-400">
                          {event.created_at
                            ? new Date(event.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Unknown"}
                        </span>
                      </div>
                      <p className="mt-2 text-base font-normal leading-snug text-zinc-800 dark:text-zinc-200">
                        {event.description ?? "No description provided."}
                      </p>
                      <p className="mt-2 text-sm font-normal tabular-nums text-zinc-500 dark:text-zinc-400">
                        {event.location_lat.toFixed(5)}, {event.location_lng.toFixed(5)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
