const severityWeights = {
  closure: 1.0,
  accident: 0.6,
  congestion: 0.3,
};

const distanceWeights = {
  same: 1.0,
  near: 0.5,
  far: 0.2,
};

const horizons = [15, 30, 60];

const scenarios = [
  { name: "single_closure_same_zone", incidents: [{ severity: "closure", distance: "same", minutesAgo: 5 }] },
  {
    name: "mixed_incidents_cluster",
    incidents: [
      { severity: "closure", distance: "same", minutesAgo: 8 },
      { severity: "accident", distance: "near", minutesAgo: 15 },
      { severity: "congestion", distance: "same", minutesAgo: 10 },
    ],
  },
  {
    name: "stale_low_severity",
    incidents: [
      { severity: "congestion", distance: "near", minutesAgo: 90 },
      { severity: "congestion", distance: "far", minutesAgo: 110 },
    ],
  },
];

function timeDecay(minutesAgo) {
  return Math.exp((-Math.log(2) * minutesAgo) / 45);
}

function scoreLevel(score) {
  if (score < 35) return "low";
  if (score < 70) return "medium";
  return "high";
}

function scenarioBaseImpact(incidents) {
  return incidents.reduce((sum, incident) => {
    return (
      sum +
      severityWeights[incident.severity] *
        distanceWeights[incident.distance] *
        timeDecay(incident.minutesAgo)
    );
  }, 0);
}

for (const scenario of scenarios) {
  const baseImpact = scenarioBaseImpact(scenario.incidents);
  const results = horizons.map((horizon) => {
    const horizonScale = horizon === 15 ? 1 : horizon === 30 ? 1.15 : 1.3;
    const score = Math.max(0, Math.min(100, baseImpact * 28 * horizonScale));
    return {
      horizon,
      score: Number(score.toFixed(2)),
      level: scoreLevel(score),
    };
  });
  console.log(`Scenario: ${scenario.name}`);
  console.table(results);
}
