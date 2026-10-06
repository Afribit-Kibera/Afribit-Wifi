// Install only the additive request replay table before the strict API release.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "[SENSITIVE]") throw new Error("Missing private database configuration");
  const client = neon(process.env.DATABASE_URL);
  const statements = (await readFile("scripts/mesh/agent-replay-schema.sql", "utf8"))
    .replace(/^\s*--.*$/gm, "").split(";").map(value => value.trim()).filter(Boolean);
  await client.transaction(statements.map(statement => client.query(statement)), { isolationLevel: "Serializable" });
  const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='mesh_agent_requests' ORDER BY ordinal_position");
  if (columns.map(row => row.column_name).join(",") !== "replay_key,router_id,expires_at") throw new Error("Unexpected replay schema");
  const report = { checkedAt: new Date().toISOString(), replaySchemaInstalled: true, customerOrPaymentDataChanged: false };
  await mkdir("artifacts/mesh-lab/private/security-release", { recursive: true });
  await writeFile("artifacts/mesh-lab/private/security-release/replay-schema.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch(() => { console.error("Replay schema installation unconfirmed; inspect private database configuration"); process.exitCode = 1; });
