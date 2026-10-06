"""Install only static portal assets on the pinned lab router; preserve policy.

Default is inspect-only. --apply saves previous files and verifies uploaded
bytes. This cannot enroll a serving router, alter DHCP/firewalls, issue access,
start a payment, or install a trusted CAPPORT certificate.
"""
import base64
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[2]
HOST = "10.20.0.1"
PIN = "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ"
FILES = ("mesh.html", "login.html", "status.html", "fstatus.html", "api.json", "bitcoin.svg", "blink.svg", "signal.svg",
         "learn-bitcoin.jpg", "learn-community.jpg", "learn-diploma.jpg")


def main():
    if sys.argv[1:] not in ([], ["--apply"]):
        raise ValueError("Use inspect-only or --apply")
    values = {}
    for line in (ROOT / ".env.mesh-native").read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")

    class PinnedHost(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            actual = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
            if actual != PIN:
                raise paramiko.SSHException("Portal router identity mismatch")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(PinnedHost())
    try:
        client.connect(HOST, username=values["MIKROTIK_USERNAME"], password=values["MIKROTIK_PASSWORD"],
                       look_for_keys=False, allow_agent=False, timeout=8, auth_timeout=8, banner_timeout=8)
        command = (':if ([/system identity get name] != "KM-LAB-001" || '
                   '[/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }; '
                   ':local hs [/ip hotspot find where name="KM-MESH-001"]; '
                   ':if ([:len $hs] != 1) do={ :error "Unexpected HotSpot" }; '
                   ':put [/ip hotspot profile get [/ip hotspot get $hs profile] html-directory]')
        _, stdout, stderr = client.exec_command(command, timeout=15)
        directory = stdout.read().decode().strip().strip("/")
        errors = stderr.read()
        if stdout.channel.recv_exit_status() or errors or directory not in ("mesh-captive", "flash/mesh-captive"):
            raise ValueError("Inspect the pinned HotSpot asset directory before installation")
        with client.open_sftp() as sftp:
            current = {}
            for name in FILES:
                remote = directory + "/" + name
                try:
                    with sftp.open(remote, "rb") as source:
                        current[name] = source.read()
                except FileNotFoundError:
                    current[name] = None
            # Reuse the site's public capability file; never overwrite it with
            # the intentionally disabled repository defaults.
            with sftp.open(directory + "/site-config.js", "rb") as source:
                config = source.read().decode("utf-8")
            if "KM-LAB-001" not in config or "https://mesh-core.afribit.africa/start" not in config:
                raise ValueError("Expected enrolled site configuration unavailable")
            report = {"routerId": "KM-LAB-001", "directory": directory,
                      "files": [{"name": name, "existing": current[name] is not None,
                                 "changed": current[name] != (ROOT / "mikrotik/hotspot-mesh" / name).read_bytes()} for name in FILES],
                      "applied": False, "firewallDhcpAndSiteConfigUnchanged": True}
            if sys.argv[1:] == ["--apply"]:
                destination = ROOT / "artifacts/mesh-lab/private/persistent-portal" / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                destination.mkdir(parents=True, exist_ok=False)
                for name, previous in current.items():
                    if previous is not None:
                        (destination / name).write_bytes(previous)
                (destination / "before.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
                for name in FILES:
                    desired = (ROOT / "mikrotik/hotspot-mesh" / name).read_bytes()
                    with sftp.open(directory + "/" + name, "wb") as target:
                        target.write(desired)
                    with sftp.open(directory + "/" + name, "rb") as target:
                        if target.read() != desired:
                            raise ValueError("Asset upload unconfirmed; use retained backups")
                report.update(applied=True, verifiedFiles=len(FILES), backupDirectory=str(destination.relative_to(ROOT)))
                (destination / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            print(json.dumps(report))
    finally:
        client.close()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print(json.dumps({"error": "Persistent portal installation unconfirmed; inspect retained files before retry"}))
        sys.exit(1)
