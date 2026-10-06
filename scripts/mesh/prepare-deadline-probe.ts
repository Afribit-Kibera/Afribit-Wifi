// Prepare one clearly labelled operator diagnostic. No payment or receipt reuse.
// The router starts its 60-second deadline on import, not during preparation.
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  const short = process.argv.includes("--short");
  const username = short ? "mesh60" : "md-probe-" + randomUUID().replaceAll("-", "");
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const password = short ? Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join("") : randomBytes(24).toString("base64url");
  const stem = short ? "probe-short" : "probe";
  const directory = "artifacts/mesh-lab/private/deadline-probe";
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const command = `{ :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected diagnostic router" }; ` +
    `:if ([/system ntp client get status] != "synchronized") do={ :error "Diagnostic clock untrusted" }; ` +
    `:if ([:len [/ip hotspot user find where profile="KM-MESH-DEADLINE-5M"]] != 0) do={ :error "Inspect existing deadline account; do not renew" }; ` +
    `:if ([:len [/ip hotspot user find where name="${username}"]] != 0) do={ :error "Diagnostic username already exists" }; ` +
    `:if ([:len [/ip hotspot host find where address="10.30.0.197" and mac-address="B4:85:E1:DD:17:29" and server="KM-MESH-001"]] != 1) do={ :error "Phone host changed; verify current address" }; ` +
    `:if ([:len [/ip hotspot active find where address="10.30.0.197"]] != 0) do={ :error "Phone already active" }; ` +
    `:local tick [/system scheduler find where name="KM-MESH-DEADLINE-TICK"]; ` +
    `:if ([:len $tick] != 1) do={ :error "Diagnostic deadline guard missing" }; ` +
    `:if ([/system scheduler get $tick disabled] = true || [/system scheduler get $tick run-count] = 0) do={ :error "Diagnostic deadline guard stopped" }; ` +
    `:local deadline (([:tonsec [:timestamp]] / 1000000000) + 60); ` +
    `/ip hotspot user add name="${username}" password="${password}" server="KM-MESH-001" profile="KM-MESH-DEADLINE-5M" mac-address="B4:85:E1:DD:17:29" limit-uptime=60s disabled=yes comment=("mesh-deadline-v1:" . $deadline); ` +
    `:if ([/system ntp client get status] != "synchronized") do={ :error "Diagnostic clock changed; account remains closed" }; ` +
    `/ip hotspot user set [find where name="${username}"] disabled=no; :put ("DIAGNOSTIC_DEADLINE_STARTED epoch=" . $deadline) }`;
  await writeFile(directory + `/${stem}.rsc`, "# Operator diagnostic, no payment receipt.\n" + command + "\n", { flag: "wx", mode: 0o600 });
  await writeFile(directory + `/${stem}.json`, JSON.stringify({ purpose: "operator-diagnostic", username, password,
    ipAddress: "10.30.0.197", macAddress: "B4:85:E1:DD:17:29", durationSeconds: 60, startsOnRouterImport: true }) + "\n", { flag: "wx", mode: 0o600 });
  await writeFile(directory + (short ? "/mesh60.txt" : "/mesh-deadline-probe.txt"), `Mesh deadline diagnostic — no payment\n\nLogin: http://10.30.0.1/commissioning/login\nUsername: ${username}\nPassword: ${password}\n\n60 seconds from provisioning, including idle time.\n`, { flag: "wx", mode: 0o600 });
  console.log("Diagnostic prepared privately; no account created, timer started or payment made.");
}
main().catch(() => { console.error("Probe preparation stopped; inspect existing private files before retry"); process.exitCode = 1; });
