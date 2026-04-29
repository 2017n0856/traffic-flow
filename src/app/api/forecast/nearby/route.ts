import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

function parseNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const lat = parseNumber(url.searchParams.get("lat"));
    const lng = parseNumber(url.searchParams.get("lng"));
    const radiusKm = parseNumber(url.searchParams.get("radiusKm")) ?? 5;
    const horizonMinutes = parseNumber(url.searchParams.get("horizonMinutes")) ?? 30;

    if (lat === null || lng === null) {
      return NextResponse.json({ error: "lat and lng are required." }, { status: 400 });
    }
    if (![15, 30, 60].includes(horizonMinutes)) {
      return NextResponse.json({ error: "horizonMinutes must be one of 15, 30, 60." }, { status: 400 });
    }
    if (radiusKm <= 0 || radiusKm > 50) {
      return NextResponse.json({ error: "radiusKm must be between 0 and 50." }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin.rpc("get_forecasts_in_radius", {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
      requested_horizon: horizonMinutes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      horizonMinutes,
      radiusKm,
      forecasts: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch forecasts." },
      { status: 500 },
    );
  }
}
