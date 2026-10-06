// Restore this project's scoped checkout configuration using local credentials.
// Values are passed over stdin, never shell arguments or logs.
import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { readPaystackConfig } from "../../lib/payments/paystack";
import { readEngineConfig } from "../../lib/payments/insats-engine";

async function main() {
  const paystackEnv = parseEnv(await readFile(".env.paystack.live", "utf8"));
  const engineEnv = parseEnv(await readFile(".env.mesh-engine", "utf8"));
  const values: Record<string, string> = {
    PAYSTACK_MODE: "live", PAYSTACK_ENABLED: "true",
    PAYSTACK_SECRET_KEY: paystackEnv.PAYSTACK_SECRET_KEY ?? "",
    PAYSTACK_PUBLIC_KEY: paystackEnv.PAYSTACK_PUBLIC_KEY ?? "",
    PAYSTACK_RECEIPT_EMAIL: paystackEnv.PAYSTACK_RECEIPT_EMAIL ?? "",
    BLINK_SETTLEMENT_ENABLED: "true", INSATS_ENGINE_URL: "https://engine.insats.org",
    INSATS_MESH_SERVICE_KEY: engineEnv.INSATS_MESH_SERVICE_KEY ?? "",
    MESH_LIGHTNING_ADDRESS: "spira@blink.sv",
  };
  if (Object.values(values).some(value => !value || value.includes("[SENSITIVE]"))) throw new Error("Local checkout configuration is incomplete");
  if (readPaystackConfig(values).mode !== "live") throw new Error("Live Paystack configuration required");
  readEngineConfig(values);
  if (process.argv[2] !== "--apply") { console.log("Local live checkout configuration validated; no changes made"); return; }
  for (const [key, value] of Object.entries(values)) {
    await new Promise<void>((accept, reject) => {
      const child = spawn(process.execPath, [join(process.env.APPDATA!, "npm/node_modules/vercel/dist/vc.js"),
        "env", "add", key, "production", "--force", "--yes"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.resume(); child.stderr.resume(); child.stdin.end(value);
      child.on("error", () => reject(new Error(`Could not restore ${key}`)));
      child.on("close", code => code === 0 ? accept() : reject(new Error(`Could not restore ${key}`)));
    });
    console.log(`${key}: restored`);
  }
}
main().catch(() => { console.error("Checkout configuration restoration unconfirmed; no secret values logged"); process.exitCode = 1; });
