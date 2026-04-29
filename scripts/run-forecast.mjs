import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.FORECAST_BASE_URL ?? "http://localhost:3000";
const runSecret = process.env.FORECAST_RUN_SECRET;

if (!runSecret) {
  console.error("Missing FORECAST_RUN_SECRET in environment.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/forecast/run`, {
  method: "POST",
  headers: {
    "x-forecast-secret": runSecret,
  },
});

const payload = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error("Forecast run failed:", payload);
  process.exit(1);
}

console.log("Forecast run complete:", payload);
