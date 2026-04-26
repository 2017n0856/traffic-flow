"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { reportIncident } from "@/services/client/incidents";
import {
  adminBodyMutedClass,
  adminFormControlClass,
  adminFormFieldErrorClass,
  adminFormLabelClass,
  adminSectionTitleClass,
  bodyMutedClass,
  formControlClass,
  formFieldErrorClass,
  formLabelClass,
  sectionTitleClass,
} from "@/lib/ui/form";

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
  /** Larger type + semibold labels (admin + user portal report) */
  largeTypography?: boolean;
};

export function IncidentReportForm({
  defaultStatus = "approved",
  successMessage = "Incident submitted successfully. It is now live for users.",
  helperText = "Create a new incident marker for moderation and public publishing.",
  largeTypography = false,
}: IncidentReportFormProps) {
  const titleClass = largeTypography ? adminSectionTitleClass : sectionTitleClass;
  const mutedClass = largeTypography ? adminBodyMutedClass : bodyMutedClass;
  const labelClass = largeTypography ? adminFormLabelClass : formLabelClass;
  const controlClass = largeTypography ? adminFormControlClass : formControlClass;
  const errClass = largeTypography ? adminFormFieldErrorClass : formFieldErrorClass;
  const labelBlock = largeTypography ? "block text-base" : "block text-sm";
  const mapHintClass = largeTypography
    ? "text-base font-semibold text-zinc-800 dark:text-zinc-200"
    : "text-sm font-medium text-zinc-800 dark:text-zinc-200";
  const geoBtnClass = largeTypography
    ? "rounded-md border border-zinc-300 px-3 py-2 text-base font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
    : "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900";
  const coordHintClass = largeTypography
    ? "text-sm font-normal text-zinc-500 dark:text-zinc-400"
    : "text-xs font-normal text-zinc-500 dark:text-zinc-400";
  const submitClass = largeTypography
    ? "rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    : "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";
  const okMsgClass = largeTypography
    ? "text-base font-normal text-emerald-600 dark:text-emerald-400"
    : "text-sm font-normal text-emerald-600 dark:text-emerald-400";
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
      const { response, body: payload } = await reportIncident({
        type,
        description,
        locationLat: selectedCoordinates.lat,
        locationLng: selectedCoordinates.lng,
        defaultStatus,
      });

      if (!response.ok) {
        setError(payload.error ?? "Failed to submit incident.");
        return;
      }

      setDescription("");
      setSelectedCoordinates(null);
      setMessage(
        payload.autoApproved
          ? "Incident submitted and auto-approved based on nearby matching reports."
          : successMessage,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className={titleClass}>Report Incident</h2>
      <p className={`mt-1 ${mutedClass}`}>{helperText}</p>

      <form className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5" onSubmit={onSubmit}>
        <div className="space-y-2 lg:col-span-3">
          <p className={mapHintClass}>Click on map to drop incident marker</p>
          <button
            type="button"
            onClick={moveToCurrentLocation}
            disabled={locating}
            className={geoBtnClass}
          >
            {locating ? "Locating..." : "Use current location"}
          </button>
          <IncidentMapPicker
            selected={selectedCoordinates}
            focusCoordinates={focusCoordinates}
            onSelect={setSelectedCoordinates}
          />
          <p className={coordHintClass}>
            {selectedCoordinates
              ? `Selected: ${selectedCoordinates.lat.toFixed(5)}, ${selectedCoordinates.lng.toFixed(5)}`
              : "No location selected yet."}
          </p>
          {locationError ? <p className={errClass}>{locationError}</p> : null}
        </div>

        <div className="space-y-3 lg:col-span-2">
          <label className={labelBlock}>
            <span className={`mb-1 block ${labelClass}`}>Incident type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              className={controlClass}
            >
              {incidentTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className={labelBlock}>
            <span className={`mb-1 block ${labelClass}`}>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`min-h-[12rem] sm:min-h-[16rem] lg:min-h-[20rem] ${controlClass}`}
              placeholder="Describe what happened..."
            />
          </label>

          {error ? <p className={errClass}>{error}</p> : null}
          {message ? <p className={okMsgClass}>{message}</p> : null}

          <button type="submit" disabled={pending} className={submitClass}>
            {pending ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </section>
  );
}
