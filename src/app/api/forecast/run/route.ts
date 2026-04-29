import { NextResponse } from "next/server";
import { computeForecastRows, buildZoneAggregates } from "@/lib/forecast/compute";
import { FORECAST_HORIZONS } from "@/lib/forecast/horizons";
import { fetchApprovedIncidentsForForecast, upsertForecastRows } from "@/lib/forecast/repository";

function assertRunSecret(request: Request) {
  const expectedSecret = process.env.FORECAST_RUN_SECRET;
  if (!expectedSecret) {
    throw new Error("Missing FORECAST_RUN_SECRET.");
  }
  const suppliedSecret = request.headers.get("x-forecast-secret");
  return suppliedSecret === expectedSecret;
}

export async function POST(request: Request) {
  try {
    if (!assertRunSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startedAt = Date.now();
    const incidents = await fetchApprovedIncidentsForForecast();
    const zones = buildZoneAggregates(incidents);
    const rows = computeForecastRows({ zones, horizons: FORECAST_HORIZONS });
    const { upserted } = await upsertForecastRows(rows);
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      processedIncidents: incidents.length,
      processedZones: zones.length,
      rowsUpserted: upserted,
      elapsedMs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run forecast job." },
      { status: 500 },
    );
  }
}
