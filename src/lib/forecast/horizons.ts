export const FORECAST_HORIZONS = [15, 30, 60] as const;

export type ForecastHorizon = (typeof FORECAST_HORIZONS)[number];

export const FORECAST_HALF_LIFE_MINUTES = 45;

export const FORECAST_LEVEL_THRESHOLDS = {
  lowMax: 35,
  mediumMax: 70,
} as const;
