import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function runSupabaseCheck() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "supabase:check"], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`supabase:check failed with exit code ${code ?? "unknown"}`));
    });
  });
}

function runForecastScript() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "forecast:run"], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`forecast:run failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function waitForServer(baseUrl) {
  const maxAttempts = 60;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(baseUrl, { method: "GET" });
      if (response.ok || response.status < 500) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Dev server did not become ready at ${baseUrl} in time.`);
}

async function triggerForecast(baseUrl) {
  const runSecret = process.env.FORECAST_RUN_SECRET;
  if (!runSecret) {
    console.warn("Skipping forecast trigger: missing FORECAST_RUN_SECRET.");
    return;
  }

  const response = await fetch(`${baseUrl}/api/forecast/run`, {
    method: "POST",
    headers: {
      "x-forecast-secret": runSecret,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn("Forecast trigger failed on startup:", payload);
    return;
  }

  console.log("Startup forecast trigger complete:", payload);
}

try {
  await runSupabaseCheck();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed supabase precheck.");
  process.exit(1);
}

const runForecastViaNpmScript = process.argv.includes("--run-forecast-script");
const nextCliArgs = process.argv.slice(2).filter((arg) => arg !== "--run-forecast-script");
const devArgs = ["next", "dev", ...nextCliArgs];
const dev = spawn("npx", devArgs, {
  stdio: "inherit",
  shell: true,
});

const baseUrl = process.env.FORECAST_BASE_URL ?? "http://localhost:3000";

void (async () => {
  try {
    await waitForServer(baseUrl);
    if (runForecastViaNpmScript) {
      await runForecastScript();
      return;
    }
    await triggerForecast(baseUrl);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Startup forecast trigger failed.");
  }
})();

const forwardSignal = (signal) => {
  if (!dev.killed) dev.kill(signal);
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

dev.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
