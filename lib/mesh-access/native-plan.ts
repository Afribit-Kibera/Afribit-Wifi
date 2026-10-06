import { deadlineTag, verifyOrder, type Enrollment, type SignedEnvelope } from "./order";

function quote(value: string) {
  return '"' + value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("$", "\\$") + '"';
}

// This command contains credentials. Deliver over pinned SSH, never log it.
// The caller must use a durable one-order-per-payment store before signing.
export function buildNativeProvisionCommand(envelope: SignedEnvelope, enrollment: Enrollment, now: number) {
  const order = verifyOrder(envelope, enrollment, now);
  // Only Primary is commissioned. Do not infer another router's policy from it.
  if (order.routerId !== "KM-LAB-001" || order.server !== "KM-MESH-001") throw new Error("Router not commissioned for native access");
  const username = quote(order.username);
  const tag = quote(deadlineTag(order.expiresAt));
  const mac = quote(order.macAddress);
  const address = quote(order.ipAddress);
  return `{ :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected native access router" }; ` +
    `:if ([/system ntp client get status] != "synchronized") do={ :error "Native access clock untrusted" }; ` +
    `:local epoch ([:tonsec [:timestamp]] / 1000000000); ` +
    `:if ($epoch < ${now - 5} || $epoch > ${now + 5} || $epoch >= ${order.expiresAt}) do={ :error "Native access deadline/clock mismatch" }; ` +
    `:local tick [/system scheduler find where name="KM-MESH-DEADLINE-TICK"]; ` +
    `:if ([:len $tick] != 1 || [:len [/system scheduler find where name="KM-MESH-DEADLINE-BOOT"]] != 1 || [:len [/system script find where name="KM-MESH-DEADLINE-SWEEP"]] != 1) do={ :error "Native deadline enforcement missing" }; ` +
    `:if ([/system scheduler get $tick disabled] = true) do={ :error "Native deadline enforcement stopped" }; ` +
    `:local profile [/ip hotspot user profile find where name="KM-MESH-DEADLINE-5M"]; ` +
    `:if ([:len $profile] != 1) do={ :error "Native access profile missing" }; ` +
    `:if ([/ip hotspot user profile get $profile address-list] != "KM-MESH-TRIAL-ACTIVE" || [/ip hotspot user profile get $profile rate-limit] != "2M/2M" || [/ip hotspot user profile get $profile shared-users] != 1 || [/ip hotspot user profile get $profile on-login] = "") do={ :error "Native profile changed" }; ` +
    `:local host [/ip hotspot host find where address=${address} and mac-address=${mac} and server="KM-MESH-001"]; ` +
    `:if ([:len $host] != 1) do={ :error "Attested phone no longer on this router" }; ` +
    `:local existing [/ip hotspot user find where name=${username}]; ` +
    `:if ([:len $existing] != 0) do={ ` +
    `:if ([:len $existing] != 1) do={ :error "Ambiguous native account" }; ` +
    `:if ([/ip hotspot user get $existing server] != "KM-MESH-001" || [/ip hotspot user get $existing profile] != "KM-MESH-DEADLINE-5M" || [/ip hotspot user get $existing mac-address] != ${mac} || [/ip hotspot user get $existing comment] != ${tag}) do={ :error "Native order conflicts with retained account" }; ` +
    `:if ([/ip hotspot user get $existing disabled] = true || [/ip hotspot user get $existing uptime] >= [/ip hotspot user get $existing limit-uptime]) do={ :error "Native retained allowance closed; do not renew" }; ` +
    `:put "MESH_NATIVE_RETAINED: no counters, credentials or deadlines changed" ` +
    `} else={ ` +
    `:if ([:len [/ip hotspot active find where address=${address}]] != 0) do={ :error "Phone already authorized" }; ` +
    `:local remaining (${order.expiresAt} - $epoch); ` +
    `/ip hotspot user add name=${username} password=${quote(order.password)} server="KM-MESH-001" profile="KM-MESH-DEADLINE-5M" mac-address=${mac} limit-uptime=($remaining . "s") disabled=yes comment=${tag}; ` +
    `:local u [/ip hotspot user find where name=${username}]; ` +
    `:if (([:tonsec [:timestamp]] / 1000000000) >= ${order.expiresAt} || [/system ntp client get status] != "synchronized") do={ :error "Native deadline elapsed before activation" }; ` +
    `/ip hotspot user set $u disabled=no; :put "MESH_NATIVE_CREATED: login required" } }`;
}
