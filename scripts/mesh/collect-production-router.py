"""Pinned SSH, read-only inventory for the existing serving router.

Configuration comes from an ignored .env.3west.router file. No reset, import,
export, backup, user/session change or firewall change is performed here.
Raw configuration stays in ignored private artifacts; never print it to chat.
"""
import base64
import hashlib
import ipaddress
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[2]
SECTIONS = {
    "identity": "/system identity print",
    "resource": "/system resource print",
    "routerboard": "/system routerboard print",
    "ethernet": "/interface ethernet print detail",
    "bridges": "/interface bridge print detail",
    "bridge-ports": "/interface bridge port print detail",
    "vlans": "/interface vlan print detail",
    "addresses": "/ip address print detail",
    "pools": "/ip pool print detail",
    "dhcp-servers": "/ip dhcp-server print detail",
    "dhcp-networks": "/ip dhcp-server network print detail",
    "hotspots": "/ip hotspot print detail",
    "hotspot-profiles": "/ip hotspot profile print detail",
    # User-profile login/logout scripts may contain credentials: never print them.
    "user-profiles": ':foreach id in=[/ip hotspot user profile find] do={ :put ("name=" . [/ip hotspot user profile get $id name] . " rate=" . [/ip hotspot user profile get $id rate-limit] . " shared=" . [/ip hotspot user profile get $id shared-users] . " session=" . [/ip hotspot user profile get $id session-timeout] . " mac-cookie=" . [/ip hotspot user profile get $id add-mac-cookie]) }',
    "user-count": "/ip hotspot user print count-only",
    "active-count": "/ip hotspot active print count-only",
    "ip-bindings": "/ip hotspot ip-binding print detail",
    "walled-garden": "/ip hotspot walled-garden print detail",
    "walled-garden-ip": "/ip hotspot walled-garden ip print detail",
    "filter": "/ip firewall filter print detail",
    "raw": "/ip firewall raw print detail",
    "nat": "/ip firewall nat print detail",
    "mangle": "/ip firewall mangle print detail",
    "queues": "/queue simple print detail",
    "services": "/ip service print detail",
    "ipv6-settings": "/ipv6 settings print",
    "ipv6-addresses": "/ipv6 address print detail",
    "ipv6-filter": "/ipv6 firewall filter print detail",
    "ntp": "/system ntp client print",
    "scheduler-count": "/system scheduler print count-only",
    "script-count": "/system script print count-only",
    # Never print RADIUS's secret or complete user/scheduler/script records.
    "radius": ':foreach id in=[/radius find] do={ :put ("address=" . [/radius get $id address] . " service=" . [/radius get $id service] . " disabled=" . [/radius get $id disabled]) }',
}


def config():
    path = ROOT / ".env.3west.router"
    values = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                name, value = line.split("=", 1)
                values[name.strip()] = value.strip().strip('"').strip("'")
    for name in ["ROUTER_HOST", "ROUTER_PORT", "ROUTER_USERNAME", "ROUTER_PASSWORD", "ROUTER_HOST_KEY_SHA256"]:
        if os.environ.get(name):
            values[name] = os.environ[name]
    host = ipaddress.ip_address(values["ROUTER_HOST"])
    if not (host.is_private or host in ipaddress.ip_network("100.64.0.0/10")):
        raise ValueError("Use private management or Tailscale access")
    port = int(values.get("ROUTER_PORT", "22"))
    if not 1 <= port <= 65535:
        raise ValueError("Invalid SSH port")
    pin = values["ROUTER_HOST_KEY_SHA256"]
    if not pin.startswith("SHA256:") or len(pin) != 50:
        raise ValueError("Verify and configure the SSH host fingerprint first")
    return values, port


class PinnedHost(paramiko.MissingHostKeyPolicy):
    def __init__(self, pin):
        self.pin = pin

    def missing_host_key(self, client, hostname, key):
        actual = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
        if actual != self.pin:
            raise paramiko.SSHException("Host key mismatch")


def main():
    values, port = config()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = ROOT / "artifacts" / "mesh-lab" / "private" / "production-review" / ("3west-router-" + stamp)
    destination.mkdir(parents=True, exist_ok=False)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(PinnedHost(values["ROUTER_HOST_KEY_SHA256"]))
    statuses = {}
    try:
        client.connect(values["ROUTER_HOST"], port=port, username=values["ROUTER_USERNAME"],
                       password=values["ROUTER_PASSWORD"], look_for_keys=False, allow_agent=False,
                       timeout=15, banner_timeout=15, auth_timeout=15)
        for name, command in SECTIONS.items():
            _, stdout, stderr = client.exec_command(command, timeout=20)
            body, error = stdout.read(262145), stderr.read(16385)
            status = stdout.channel.recv_exit_status()
            if len(body) > 262144 or len(error) > 16384:
                raise ValueError("Inventory section exceeded its output limit")
            (destination / (name + ".txt")).write_bytes(body + error)
            statuses[name] = {"exitCode": status, "bytes": len(body) + len(error)}
        report = {"checkedAt": stamp, "host": values["ROUTER_HOST"], "readOnly": True, "sections": statuses}
        (destination / "inventory.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(json.dumps({"readOnly": True, "sectionsSaved": len(statuses),
                          "sectionsWithErrors": sum(item["exitCode"] != 0 for item in statuses.values()),
                          "directory": str(destination)}))
    finally:
        client.close()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("Serving-router inventory unconfirmed. Check private configuration and the pinned host; no router settings were changed.")
        raise SystemExit(1)
