import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type { TrafficEvent } from "@/types/supabase";
import type { ComputedForecastRow } from "@/lib/forecast/compute";

export async function fetchApprovedIncidentsForForecast(lookbackHours = 6) {
  const fromIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("traffic_events")
    .select("*")
    .eq("status", "approved")
    .eq("is_predicted", false)
    .gte("created_at", fromIso);

  if (error) throw new Error(error.message);
  return (data ?? []) as TrafficEvent[];
}

export async function upsertForecastRows(rows: ComputedForecastRow[]) {
  if (rows.length === 0) return { upserted: 0 };
  const admin = createServiceRoleClient();
  const { error } = await admin.from("traffic_forecasts").upsert(rows, {
    onConflict: "zone_key,horizon_minutes,generated_at",
  });
  if (error) throw new Error(error.message);
  return { upserted: rows.length };
}
