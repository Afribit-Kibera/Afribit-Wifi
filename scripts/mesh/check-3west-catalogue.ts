import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { compareThreeWestCatalogue } from "../../lib/production/3west-catalogue";

const plan = z.object({
  name: z.string(), priceKes: z.number().int().positive(), active: z.boolean(),
  kind: z.enum(["hotspot", "tv"]).optional(), speedLimitKbps: z.number().nullable().optional(),
  downloadKbps: z.number().optional(), uploadKbps: z.number().optional(), dataLimitMb: z.number().nullable().optional(),
  uptimeLimitMinutes: z.number().nullable().optional(),
  validity: z.object({ unit: z.enum(["day", "month"]), value: z.number().int().positive() }).optional(),
  fup: z.boolean().optional(),
});

async function main() {
  const snapshotPath = process.argv[2];
  if (!snapshotPath || process.argv.length !== 3) throw new Error("Usage: npm run mesh:catalogue-check -- <snapshot.json>");
  // Read-only: no database, environment keys, network, payment or router calls.
  const snapshot = z.object({ packages: z.array(plan).max(1000) }).parse(JSON.parse(await readFile(resolve(snapshotPath), "utf8")));
  const result = compareThreeWestCatalogue(snapshot.packages);
  console.log(JSON.stringify({ scope: "catalogue parity only; router and payment commissioning are separate", ...result }, null, 2));
  if (!result.catalogueMatches) process.exitCode = 2;
}
main().catch(() => { console.error("Catalogue snapshot could not be checked. Supply a valid local JSON export."); process.exitCode = 1; });
