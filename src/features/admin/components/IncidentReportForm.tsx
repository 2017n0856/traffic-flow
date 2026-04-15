"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const incidentTypes = ["accident", "closure", "congestion"] as const;

type IncidentType = (typeof incidentTypes)[number];
type Coordinates = { lat: number; lng: number };

const IncidentMapPicker = dynamic(
  () =>
    import("@/features/admin/components/IncidentMapPicker").then((mod) => mod.IncidentMapPicker),
  { ssr: false },
);

type IncidentReportFormProps = {
  defaultStatus?: "pending" | "approved";
  successMessage?: string;
  helperText?: string;
};

export function IncidentReportForm({
  defaultStatus = "approved",
  successMessage = "Incident submitted successfully. It is now live for users.",
  helperText = "Create a new incident marker for moderation and public publishing.",
}: IncidentReportFormProps) {
  const [type, setType] = useState<IncidentType>("accident");
  const [description, setDescription] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [focusCoordinates, setFocusCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function moveToCurrentLocation() {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedCoordinates(nextCoordinates);
        setFocusCoordinates(nextCoordinates);
        setLocating(false);
      },
      (positionError) => {
        setLocationError(positionError.message || "Unable to fetch your current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    if (!selectedCoordinates) {
      setPending(false);
      setError("Please click on the map to place an incident marker.");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("traffic_events").insert({
        type,
        description: description.trim() || null,
        status: defaultStatus,
        is_predicted: false,
        location_lat: selectedCoordinates.lat,
        location_lng: selectedCoordinates.lng,
        reported_by: user?.id ?? null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setDescription("");
      setSelectedCoordinates(null);
      setMessage(successMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Report Incident</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {helperText}
      </p>

      <form className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5" onSubmit={onSubmit}>
        <div className="space-y-2 lg:col-span-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Click on map to drop incident marker
          </p>
          <button
            type="button"
            onClick={moveToCurrentLocation}
            disabled={locating}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {locating ? "Locating..." : "Use current location"}
          </button>
          <IncidentMapPicker
            selected={selectedCoordinates}
            focusCoordinates={focusCoordinates}
            onSelect={setSelectedCoordinates}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedCoordinates
              ? `Selected: ${selectedCoordinates.lat.toFixed(5)}, ${selectedCoordinates.lng.toFixed(5)}`
              : "No location selected yet."}
          </p>
          {locationError ? (
            <p className="text-xs text-red-600 dark:text-red-400">{locationError}</p>
          ) : null}
        </div>

        <div className="space-y-3 lg:col-span-2">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Incident type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {incidentTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-300">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[20rem] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Describe what happened..."
            />
          </label>

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </section>
  );
}
