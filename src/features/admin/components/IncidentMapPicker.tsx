"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type Coordinates = {
  lat: number;
  lng: number;
};

type IncidentMapPickerProps = {
  selected: Coordinates | null;
  focusCoordinates?: Coordinates | null;
  onSelect: (coordinates: Coordinates) => void;
};

const SYDNEY_COORDINATES: [number, number] = [-33.8688, 151.2093];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({
  onSelect,
}: {
  onSelect: (coordinates: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FocusOnCoordinates({
  focusCoordinates,
}: {
  focusCoordinates?: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusCoordinates) return;
    map.flyTo([focusCoordinates.lat, focusCoordinates.lng], 15, {
      animate: true,
    });
  }, [focusCoordinates, map]);

  return null;
}

export function IncidentMapPicker({
  selected,
  focusCoordinates,
  onSelect,
}: IncidentMapPickerProps) {
  const center = useMemo<[number, number]>(() => {
    if (!selected) return SYDNEY_COORDINATES;
    return [selected.lat, selected.lng];
  }, [selected]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      <MapContainer
        center={center}
        zoom={12}
        className="h-[34rem] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} />
        <FocusOnCoordinates focusCoordinates={focusCoordinates} />
        {selected ? (
          <Marker position={[selected.lat, selected.lng]} icon={markerIcon} />
        ) : null}
      </MapContainer>
    </div>
  );
}
