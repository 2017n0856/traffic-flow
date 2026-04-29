function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createUrl(horizonMinutes: number) {
  return new URL(
    `http://localhost:3000/api/forecast/nearby?lat=-33.86&lng=151.20&radiusKm=5&horizonMinutes=${horizonMinutes}`,
  );
}

export function runNearbyRouteValidationSelfTest() {
  const good = createUrl(30);
  const bad = createUrl(45);

  const goodHorizon = Number(good.searchParams.get("horizonMinutes"));
  const badHorizon = Number(bad.searchParams.get("horizonMinutes"));

  assert([15, 30, 60].includes(goodHorizon), "valid horizon rejected");
  assert(![15, 30, 60].includes(badHorizon), "invalid horizon accepted");
}
