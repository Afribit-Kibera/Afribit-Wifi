// Bounded lab command, deliberately separate from gateway-agent/index.ts.
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { InsatsSettlementClient, readEngineConfig } from "../lib/payments/insats-engine";
import { provisionMeshOrder } from "./mesh-order";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
async function main() {
  if (process.env.MESH_NATIVE_OPERATOR_ENABLED !== "true") throw new Error("Native operator consumer is disabled");
  const orderFile = process.argv[2];
  if (!orderFile) throw new Error("Supply an immutable signed order file");
  const enrollment = { routerId: "KM-LAB-001", server: "KM-MESH-001", key: required("MESH_ROUTER_SERVICE_KEY") };
  const engine = new InsatsSettlementClient(readEngineConfig());
  const result = await provisionMeshOrder(JSON.parse(await readFile(orderFile, "utf8")), {
    enrollment, ledgerDirectory: resolve("artifacts/mesh-lab/private/native-orders"), amountKes: 10,
    destination: engine.config.destination, now: () => Math.floor(Date.now() / 1000),
    getReceipt: (id, amount) => engine.getReceipt(id, amount),
    execute: async command => {
      // Fixed Primary enrollment; router identity/serial also checked in command.
      const request = { host: "10.20.0.1", username: required("MIKROTIK_USERNAME"), password: required("MIKROTIK_PASSWORD"),
        fingerprint: "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ", command };
      return new Promise<"created" | "retained">((accept, reject) => {
        const child = spawn(process.env.MESH_PYTHON ?? "py", ["gateway-agent/mesh-ssh.py"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
        let output = "";
        const timer = setTimeout(() => { child.kill(); reject(new Error("Native SSH result unconfirmed")); }, 45_000);
        child.stdout.on("data", data => { output = (output + data).slice(-4096); });
        child.stderr.resume(); // Raw library errors can contain private details.
        child.on("error", () => { clearTimeout(timer); reject(new Error("Native SSH helper could not start")); });
        child.on("close", code => {
          clearTimeout(timer);
          try {
            const parsed = JSON.parse(output);
            if (code !== 0 || !["created", "retained"].includes(parsed.result)) throw new Error();
            accept(parsed.result);
          } catch { reject(new Error("Native provisioning unconfirmed; inspect retained state")); }
        });
        child.stdin.on("error", () => {});
        child.stdin.end(JSON.stringify(request));
      });
    },
  });
  console.log(JSON.stringify(result)); // Public identifiers/status only, never password.
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Native order failed"); process.exitCode = 1; });
