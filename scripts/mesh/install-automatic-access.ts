import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "[SENSITIVE]") throw new Error("Load the existing private database configuration");
  const client = neon(process.env.DATABASE_URL);
  const statements = (await Promise.all(["scripts/mesh/automatic-access-schema.sql", "scripts/mesh/voucher-redemption-schema.sql", "scripts/mesh/checkout-reservations-schema.sql", "scripts/mesh/agent-replay-schema.sql"].map(file => readFile(file, "utf8"))))
    .flatMap(source => source.replace(/^\s*--.*$/gm, "").split(";").map(part => part.trim()).filter(Boolean));
  await client.transaction(statements.map(statement => client.query(statement)), { isolationLevel: "Serializable" });
  const catalogue = await client.query("SELECT name,price_kes,duration_minutes,data_limit_mb,speed_limit_kbps FROM packages WHERE active ORDER BY sort_order");
  console.log(JSON.stringify({ additiveSchemaInstalled: true, catalogue }, null, 2));
}
main().catch(() => { console.error("Automatic access schema installation unconfirmed; inspect database configuration"); process.exitCode = 1; });
