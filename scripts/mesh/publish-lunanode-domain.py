"""Publish only the dedicated Mesh hostname, then verify Caddy HTTPS.

The optional Afribit token is read from ignored .env.mesh-lunanode. Without it,
an operator-created DNS record must already resolve to the commissioned VM.
"""
import importlib.util
import json
import os
import socket
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/lunanode"
HOST = "mesh-core.afribit.africa"


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def publish_dns(ip):
    config_path = ROOT / ".env.mesh-lunanode"
    values = {}
    if config_path.exists():
        for line in config_path.read_text(encoding="utf-8-sig").splitlines():
            if "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    if values.get("CLOUDFLARE_API_TOKEN"):
        os.environ["CLOUDFLARE_API_TOKEN"] = values["CLOUDFLARE_API_TOKEN"]
        cf = module("mesh_cf", Path(r"G:\My Drive\workspaces\insats\ops\lunanode\cloudflare_dns.py"))
        zones = cf.cf_request("GET", "/zones?name=afribit.africa")["result"]
        if len(zones) != 1 or zones[0]["name"] != "afribit.africa":
            raise RuntimeError("Afribit zone access is unavailable")
        path = f"/zones/{zones[0]['id']}/dns_records"
        existing = cf.cf_request("GET", path + "?" + urllib.parse.urlencode({"name": HOST}))["result"]
        conflict = [r for r in existing if r["type"] == "CNAME" or r["type"] == "AAAA" or
                    (r["type"] == "A" and (r["content"] != ip or r.get("proxied")))]
        if conflict:
            raise RuntimeError("Existing hostname routes differ; no DNS record overwritten")
        if not any(r["type"] == "A" for r in existing):
            cf.cf_request("POST", path, {"type": "A", "name": HOST, "content": ip, "ttl": 300, "proxied": False})
            (PRIVATE / "dns-change.json").write_text(json.dumps({"type": "A", "name": HOST, "content": ip,
                                                                 "ttl": 300, "proxied": False}) + "\n")
    try:
        addresses = {i[4][0] for i in socket.getaddrinfo(HOST, 443, type=socket.SOCK_STREAM)}
    except socket.gaierror:
        addresses = set()
    if addresses != {ip}:
        raise RuntimeError(f"DNS not commissioned: add DNS-only A {HOST} -> {ip} (TTL 300), then rerun")


def main():
    state = json.loads((PRIVATE / "server.json").read_text())
    publish_dns(state["public_ip"])
    remote = module("mesh_remote", ROOT / "scripts/mesh/lunanode_remote.py")
    client = remote.connect()
    try:
        candidate = '''mesh-core.afribit.africa {
    header Cache-Control "no-store"
    header X-Content-Type-Options "nosniff"
    handle /health {
        reverse_proxy 127.0.0.1:8041
    }
    handle {
        respond "Mesh network controller. Customer checkout: https://wifi.afribit.africa" 200
    }
}
'''
        with client.open_sftp() as sftp:
            with sftp.open("/home/ubuntu/.mesh-stage/Caddyfile.https", "w") as handle:
                handle.write(candidate)
        code, _, _ = remote.execute(client, "sudo caddy validate --config /home/ubuntu/.mesh-stage/Caddyfile.https --adapter caddyfile && sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.before-https && sudo install -m 0644 /home/ubuntu/.mesh-stage/Caddyfile.https /etc/caddy/Caddyfile && sudo systemctl reload caddy")
        if code:
            raise RuntimeError("Caddy HTTPS configuration not confirmed")
    finally:
        client.close()
    for attempt in range(12):
        try:
            with urllib.request.urlopen(f"https://{HOST}/health", timeout=10) as response:
                health = json.load(response)
            (PRIVATE / "https-verification.json").write_text(json.dumps({"url": f"https://{HOST}/health", "health": health}, indent=2) + "\n")
            print(json.dumps({"url": f"https://{HOST}/health", "health": health}))
            return
        except Exception:
            if attempt == 11:
                raise RuntimeError("HTTPS certificate/health not verified; inspect Caddy and DNS")
            time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(str(error)); raise SystemExit(1)
    except Exception as error:
        print(f"Domain commissioning stopped: {type(error).__name__}; private credentials were not printed")
        raise SystemExit(1)
