import type { TrafficEvent } from "@/types/supabase";

const SEVERITY_WEIGHTS: Record<NonNullable<TrafficEvent["type"]>, number> = {
  closure: 1,
  accident: 0.6,
  congestion: 0.3,
};

export function getSeverityWeight(type: TrafficEvent["type"]) {
  if (!type) return 0;
  return SEVERITY_WEIGHTS[type];
}
