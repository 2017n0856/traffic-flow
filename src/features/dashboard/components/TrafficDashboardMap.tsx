"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { TrafficEvent, TrafficForecast } from "@/types/supabase";

type Coordinates = {
  lat: number;
  lng: number;
};

type TrafficDashboardMapProps = {
  center: Coordinates | null;
  focusCoordinates?: Coordinates | null;
  radiusKm: number;
  markers: TrafficEvent[];
  forecasts?: TrafficForecast[];
  onCenterChange: (coordinates: Coordinates) => void;
};

const SYDNEY_COORDINATES: [number, number] = [-33.8688, 151.2093];

const centerMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function getEventColor(type: TrafficEvent["type"]) {
  if (type === "accident") return "#dc2626";
  if (type === "closure") return "#f59e0b";
  return "#2563eb";
}

function getEventIcon(type: TrafficEvent["type"]) {
  const color = getEventColor(type);
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:9999px;border:2px solid #fff;background:${color};box-shadow:0 1px 4px rgba(0,0,0,.45);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function getForecastColor(level: TrafficForecast["forecast_level"]) {
  if (level === "high") return "#dc2626";
  if (level === "medium") return "#f59e0b";
  return "#22c55e";
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

function CenterSelector({ onCenterChange }: { onCenterChange: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onCenterChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FocusOnCoordinates({ focusCoordinates }: { focusCoordinates?: Coordinates | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focusCoordinates) return;
    map.flyTo([focusCoordinates.lat, focusCoordinates.lng], 14, { animate: true });
  }, [focusCoordinates, map]);
  return null;
}

export function TrafficDashboardMap({
  center,
  focusCoordinates,
  radiusKm,
  markers,
  forecasts = [],
  onCenterChange,
}: TrafficDashboardMapProps) {
  const mapCenter = useMemo<[number, number]>(() => {
    if (!center) return SYDNEY_COORDINATES;
    return [center.lat, center.lng];
  }, [center]);

  return (
    <div className="relative z-0 h-full w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer center={mapCenter} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CenterSelector onCenterChange={onCenterChange} />
        <FocusOnCoordinates focusCoordinates={focusCoordinates} />

        {center ? (
          <>
            <Marker position={[center.lat, center.lng]} icon={centerMarkerIcon}>
              <Popup>Search center point</Popup>
            </Marker>
            <Circle
              center={[center.lat, center.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.12 }}
            />
          </>
        ) : null}

        {markers.map((event) => (
          <Marker
            key={event.id}
            position={[event.location_lat, event.location_lng]}
            icon={getEventIcon(event.type)}
          >
            <Popup>
              <div className="text-base">
                <p className="font-semibold capitalize leading-tight text-zinc-900">
                  {event.type ?? "incident"}
                </p>
                <p className="mt-1 font-normal leading-snug text-zinc-800">
                  {event.description ?? "No description provided."}
                </p>
                <p className="mt-1 text-sm font-normal text-zinc-500">
                  {event.created_at ? new Date(event.created_at).toLocaleString() : "Unknown time"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {forecasts.map((forecast) => (
          <CircleMarker
            key={`${forecast.zone_key}-${forecast.horizon_minutes}-${forecast.generated_at}`}
            center={[forecast.center_lat, forecast.center_lng]}
            radius={9}
            pathOptions={{
              color: getForecastColor(forecast.forecast_level),
              fillColor: getForecastColor(forecast.forecast_level),
              fillOpacity: 0.45,
            }}
          >
            <Popup>
              <div className="text-base">
                <p className="font-semibold capitalize leading-tight text-zinc-900">
                  Forecast {forecast.forecast_level}
                </p>
                <p className="mt-1 font-normal leading-snug text-zinc-800">
                  Score {forecast.forecast_score.toFixed(1)} / 100
                </p>
                <p className="mt-1 text-sm font-normal text-zinc-500">
                  Confidence {(forecast.confidence * 100).toFixed(0)}%
                </p>
                <p className="mt-1 text-sm font-normal text-zinc-500">Display at forecast zone center</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
