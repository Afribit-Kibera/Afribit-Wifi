// Reference catalogue transcribed from the operator's 3WEST screenshots.
// TV IDs/prices were also checked against the public WispMan TV page.
// This is migration input, not a seed: importing it never changes live plans.
export type ThreeWestPlan = {
  key: string;
  kind: "hotspot" | "tv";
  sourceName: string;
  sourceId?: number;
  priceKes: number;
  downloadKbps: number;
  uploadKbps: number;
  uptimeLimitMinutes: number | null;
  validity: { unit: "day" | "month"; value: number };
  dataLimitMb: null;
  fup: false;
};

const common = { downloadKbps: 3000, uploadKbps: 3000, dataLimitMb: null, fup: false } as const;
const durations = [
  { sourceName: "24hours", tvName: "24HOURS TV", priceKes: 30, unit: "day", value: 1, sourceId: 10 },
  { sourceName: "2days", tvName: "2DAYS TV", priceKes: 55, unit: "day", value: 2, sourceId: 11 },
  { sourceName: "3days", tvName: "3DAYS TV", priceKes: 85, unit: "day", value: 3, sourceId: 12 },
  { sourceName: "1week", tvName: "1WEEK TV", priceKes: 140, unit: "day", value: 7, sourceId: 13 },
  { sourceName: "2weeks", tvName: "2WEEKS TV", priceKes: 230, unit: "day", value: 14, sourceId: 14 },
  { sourceName: "1month", tvName: "1MONTH TV", priceKes: 450, unit: "month", value: 1, sourceId: 15 },
] as const;

export const threeWestCatalogue: readonly ThreeWestPlan[] = [
  ...[
    { key: "80m", sourceName: "1hr 20mins", priceKes: 10, uptimeLimitMinutes: 80 },
    { key: "2h", sourceName: "2hours", priceKes: 15, uptimeLimitMinutes: 120 },
    { key: "4h", sourceName: "4hours", priceKes: 20, uptimeLimitMinutes: 240 },
  ].map(plan => ({ ...common, ...plan, key: `3west-hotspot-${plan.key}`, kind: "hotspot" as const, validity: { unit: "day" as const, value: 1 } })),
  ...durations.map(plan => ({ ...common, key: `3west-hotspot-${plan.sourceName}`, kind: "hotspot" as const,
    sourceName: plan.sourceName, priceKes: plan.priceKes,
    uptimeLimitMinutes: plan.priceKes === 30 ? 1440 : null, validity: { unit: plan.unit, value: plan.value } })),
  ...durations.map(plan => ({ ...common, key: `3west-tv-${plan.sourceId}`, kind: "tv" as const,
    sourceId: plan.sourceId, sourceName: plan.tvName, priceKes: plan.priceKes,
    uptimeLimitMinutes: null, validity: { unit: plan.unit, value: plan.value } })),
];

export type CatalogueSnapshotPlan = {
  name: string;
  priceKes: number;
  active: boolean;
  kind?: "hotspot" | "tv";
  speedLimitKbps?: number | null;
  downloadKbps?: number;
  uploadKbps?: number;
  dataLimitMb?: number | null;
  uptimeLimitMinutes?: number | null;
  validity?: ThreeWestPlan["validity"];
  fup?: boolean;
};
export type ParityIssue = { key: string; field: string; expected: unknown; actual: unknown };

// Prices identify legacy hotspot packages until source IDs are enrolled.
// Ambiguous, missing and extra products all fail the cutover check.
export function compareThreeWestCatalogue(snapshot: readonly CatalogueSnapshotPlan[]) {
  const active = snapshot.filter(plan => plan.active);
  const issues: ParityIssue[] = [];
  for (const expected of threeWestCatalogue) {
    const matches = active.filter(plan => (plan.kind ?? "hotspot") === expected.kind && plan.priceKes === expected.priceKes);
    if (matches.length !== 1) {
      issues.push({ key: expected.key, field: "productCount", expected: 1, actual: matches.length });
      continue;
    }
    const actual = matches[0];
    const fields: Array<[string, unknown, unknown]> = [
      ["downloadKbps", expected.downloadKbps, actual.downloadKbps ?? actual.speedLimitKbps ?? null],
      ["uploadKbps", expected.uploadKbps, actual.uploadKbps ?? actual.speedLimitKbps ?? null],
      ["uptimeLimitMinutes", expected.uptimeLimitMinutes, actual.uptimeLimitMinutes],
      ["validity", expected.validity, actual.validity],
      ["dataLimitMb", expected.dataLimitMb, actual.dataLimitMb],
      ["fup", expected.fup, actual.fup],
    ];
    for (const [field, wanted, found] of fields) {
      const equal = field === "validity"
        ? actual.validity?.unit === expected.validity.unit && actual.validity.value === expected.validity.value
        : wanted === found;
      if (!equal) issues.push({ key: expected.key, field, expected: wanted, actual: found ?? "not represented" });
    }
  }
  for (const plan of active) {
    if (!threeWestCatalogue.some(expected => expected.kind === (plan.kind ?? "hotspot") && expected.priceKes === plan.priceKes)) {
      issues.push({ key: plan.name, field: "unexpectedProduct", expected: "3WEST catalogue only", actual: plan.priceKes });
    }
  }
  return { catalogueMatches: issues.length === 0, expectedProducts: threeWestCatalogue.length, actualProducts: active.length, issues };
}
