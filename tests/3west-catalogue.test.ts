import assert from "node:assert/strict";
import { test } from "node:test";
import { threeWestCatalogue, compareThreeWestCatalogue, type CatalogueSnapshotPlan } from "../lib/production/3west-catalogue";

function matching(): CatalogueSnapshotPlan[] {
  return threeWestCatalogue.map(plan => ({ ...plan, name: plan.sourceName, active: true }));
}

test("3WEST reference retains all nine hotspot prices, six TV prices and symmetric 3 Mbps", () => {
  assert.deepEqual(threeWestCatalogue.filter(plan => plan.kind === "hotspot").map(plan => plan.priceKes), [10, 15, 20, 30, 55, 85, 140, 230, 450]);
  assert.deepEqual(threeWestCatalogue.filter(plan => plan.kind === "tv").map(plan => [plan.sourceId, plan.priceKes]), [[10, 30], [11, 55], [12, 85], [13, 140], [14, 230], [15, 450]]);
  assert(threeWestCatalogue.every(plan => plan.downloadKbps === 3000 && plan.uploadKbps === 3000 && plan.fup === false && plan.dataLimitMb === null));
  assert.equal(compareThreeWestCatalogue(matching()).catalogueMatches, true);
});

test("80 minutes of uptime and one day of validity remain separate; a month is not silently 30 days", () => {
  const starter = threeWestCatalogue[0];
  assert.equal(starter.uptimeLimitMinutes, 80);
  assert.deepEqual(starter.validity, { unit: "day", value: 1 });
  assert.deepEqual(threeWestCatalogue.find(plan => plan.kind === "hotspot" && plan.priceKes === 450)?.validity, { unit: "month", value: 1 });
  const legacy = threeWestCatalogue.filter(plan => plan.kind === "hotspot").map(plan => ({ name: plan.sourceName, active: true, priceKes: plan.priceKes, speedLimitKbps: 50000, dataLimitMb: null }));
  const result = compareThreeWestCatalogue(legacy);
  assert.equal(result.catalogueMatches, false);
  assert.equal(result.issues.filter(issue => issue.field === "downloadKbps").length, 9);
  assert.equal(result.issues.filter(issue => issue.field === "productCount").length, 6);
  assert(result.issues.some(issue => issue.key === starter.key && issue.field === "validity"));
});

test("Duplicate, missing, changed-price and extra products cannot pass a cutover check", () => {
  const valid = matching();
  assert.equal(compareThreeWestCatalogue([...valid, valid[0]]).catalogueMatches, false);
  assert.equal(compareThreeWestCatalogue(valid.slice(1)).catalogueMatches, false);
  const changed = valid.map((plan, index) => index === 0 ? { ...plan, priceKes: 11 } : plan);
  const result = compareThreeWestCatalogue(changed);
  assert.equal(result.catalogueMatches, false);
  assert(result.issues.some(issue => issue.field === "unexpectedProduct"));
  const wrongUptime = valid.map((plan, index) => index === 0 ? { ...plan, uptimeLimitMinutes: null } : plan);
  assert.equal(compareThreeWestCatalogue(wrongUptime).catalogueMatches, false);
});
