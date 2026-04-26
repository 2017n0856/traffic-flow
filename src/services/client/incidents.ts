"use client";

type ReportIncidentPayload = {
  type: "accident" | "closure" | "congestion";
  description: string;
  locationLat: number;
  locationLng: number;
  defaultStatus: "pending" | "approved";
};

type ReportIncidentResponse = {
  error?: string;
  status?: "pending" | "approved";
  autoApproved?: boolean;
};

export async function reportIncident(payload: ReportIncidentPayload) {
  const response = await fetch("/api/incidents/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ReportIncidentResponse;
  return { response, body };
}
