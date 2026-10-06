import { neon } from "@neondatabase/serverless";
import { mkdir, writeFile } from "node:fs/promises";
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Database unavailable");
  const client = neon(process.env.DATABASE_URL);
  const before = await client.query("SELECT id,name,price_kes,duration_minutes,speed_limit_kbps FROM packages WHERE active ORDER BY sort_order");
  if (before.length !== 9 || before.some(item => ![8192,50000].includes(Number(item.speed_limit_kbps)))) throw new Error("Catalogue changed; inspect before changing caps");
  if (process.argv[2] !== "--apply") { console.log(JSON.stringify({catalogue:before,newPurchaseCapKbps:50000,noChanges:true})); return; }
  await mkdir("artifacts/mesh-lab/private/automatic-setup", {recursive:true});
  await writeFile(`artifacts/mesh-lab/private/automatic-setup/catalogue-speed-before-${Date.now()}.json`, JSON.stringify(before,null,2), {mode:0o600,flag:"wx"});
  const changed = await client.query("UPDATE packages SET speed_limit_kbps=50000,updated_at=now() WHERE active AND speed_limit_kbps=8192 RETURNING id,name,price_kes,duration_minutes,speed_limit_kbps");
  console.log(JSON.stringify({changedPackages:changed.length,newPurchaseCapKbps:50000,pricesAndDurationsUnchanged:true,existingOrdersUnchanged:true}));
}
main().catch(() => { console.error("Pilot speed update unconfirmed; inspect retained catalogue snapshot"); process.exitCode = 1; });
