import type { TrafficForecast } from "@/types/supabase";
import { adminBodyMutedClass, adminFormControlClass, adminFormLabelClass } from "@/lib/ui/form";
import type { ForecastHorizon } from "@/hooks/useTrafficForecast";

type TrafficForecastPanelProps = {
  horizon: ForecastHorizon;
  onHorizonChange: (horizon: ForecastHorizon) => void;
  forecasts: TrafficForecast[];
  loading: boolean;
  error: string | null;
};

function averageScore(forecasts: TrafficForecast[]) {
  if (forecasts.length === 0) return 0;
  const total = forecasts.reduce((sum, item) => sum + item.forecast_score, 0);
  return total / forecasts.length;
}

function averageConfidence(forecasts: TrafficForecast[]) {
  if (forecasts.length === 0) return 0;
  const total = forecasts.reduce((sum, item) => sum + item.confidence, 0);
  return total / forecasts.length;
}

export function TrafficForecastPanel({
  horizon,
  onHorizonChange,
  forecasts,
  loading,
  error,
}: TrafficForecastPanelProps) {
  const meanScore = averageScore(forecasts);
  const meanConfidence = averageConfidence(forecasts);

  return (
    <div className="space-y-2 rounded-md bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <label className="block text-base">
        <span className={`mb-1 block ${adminFormLabelClass}`}>Forecast horizon</span>
        <select
          value={horizon}
          onChange={(event) => onHorizonChange(Number(event.target.value) as ForecastHorizon)}
          className={adminFormControlClass}
        >
          <option value={15}>Next 15 minutes</option>
          <option value={30}>Next 30 minutes</option>
          <option value={60}>Next 60 minutes</option>
        </select>
      </label>

      <p className={adminBodyMutedClass}>
        {forecasts.length} forecast zones loaded. Avg score {meanScore.toFixed(1)} / 100.
      </p>
      <p className={adminBodyMutedClass}>Avg confidence {(meanConfidence * 100).toFixed(0)}%</p>

      {loading ? <p className="text-sm text-zinc-500">Loading forecast...</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
