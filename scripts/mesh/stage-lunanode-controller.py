"""Install the scoped controller in standby and prepare its router tunnel.

No claims, purchases, settlements, customer grants or guest redirection. A later
cutover must freeze/copy the old ledger before enabling this daemon's active mode.
"""
import base64
import hashlib
import importlib.util
import json
import re
import shlex
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/lunanode"
PIN = "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def env_values():
    result = {}
    for line in (ROOT / ".env.mesh-native").read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def router_connect(env):
    class Pinned(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            digest = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
            if digest != PIN:
                raise RuntimeError("Router key mismatch")
            client.get_host_keys().add(hostname, key.get_name(), key)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(Pinned())
    client.connect("10.20.0.1", username=env["MIKROTIK_USERNAME"], password=env["MIKROTIK_PASSWORD"],
                   look_for_keys=False, allow_agent=False, timeout=10)
    return client


def router_run(router, command):
    # RouterOS reports many command failures on stdout with SSH exit status 0.
    # Keep raw command/configuration and library exceptions out of diagnostics.
    failure = "Router staging was not confirmed; inspect private configuration"
    try:
        _, out, err = router.exec_command(command, timeout=30)
        text, errors = out.read().decode("utf-8"), err.read()
        exit_code = out.channel.recv_exit_status()
        normalized = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text).replace("\r", "")
        diagnostic = re.search(
            r"(?im)^\s*(?:failure:|syntax error\b|expected end of command\b|bad command name\b|"
            r"no such item\b|invalid value\b|input does not match\b|not enough permissions\b|"
            r"not permitted\b|error:|script error:|expected (?:command|value|argument|closing)\b)", normalized)
        # A successful snapshot must actually be an export, not an empty
        # stream or an unrecognized error disguised as configuration backup.
        snapshot = command.strip() in ("/export", "/export terse")
        if exit_code != 0 or errors.strip() or diagnostic or (snapshot and not re.search(r"(?im)^#[^\n]*\bby RouterOS\b", normalized)):
            raise RuntimeError(failure)
        return normalized.strip()
    except Exception:
        raise RuntimeError(failure) from None


def upload_text(sftp, path, text, mode=0o600):
    with sftp.open(path, "w") as handle:
        handle.write(text)
    sftp.chmod(path, mode)


def main():
    remote = load_module("mesh_remote", ROOT / "scripts/mesh/lunanode_remote.py")
    vm = remote.connect()
    env = env_values()
    router = router_connect(env)
    try:
        identity = router_run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
        if identity.splitlines() != ["KM-LAB-001", "HH70A8H82EG"]:
            raise RuntimeError("Unexpected router identity")
        code, _, _ = remote.execute(vm, "mkdir -p /home/ubuntu/.mesh-stage && chmod 700 /home/ubuntu/.mesh-stage")
        if code:
            raise RuntimeError("Private VM staging failed")
        code, public_key, _ = remote.execute(vm, "sudo bash -c 'umask 077; test -f /etc/wireguard/mesh-private.key || wg genkey > /etc/wireguard/mesh-private.key; wg pubkey < /etc/wireguard/mesh-private.key'")
        public_key = public_key.strip()
        if code or len(base64.b64decode(public_key)) != 32:
            raise RuntimeError("VM WireGuard key unavailable")
        # Only additive management configuration, scoped to this pinned spare lab router.
        router_run(router, '{ :local w [/interface wireguard find where name="KM-MESH-CLOUD"]; '
                   ':if ([:len $w] = 0) do={ /interface wireguard add name=KM-MESH-CLOUD listen-port=51821 mtu=1420 comment="mesh:cloud:controller" }; '
                   ':if ([:len [/ip address find where interface="KM-MESH-CLOUD"]] = 0) do={ /ip address add address=10.254.30.2/30 interface=KM-MESH-CLOUD comment="mesh:cloud:controller" }; '
                   ':if ([:len [/interface wireguard peers find where interface="KM-MESH-CLOUD"]] = 0) do={ '
                   f'/interface wireguard peers add interface=KM-MESH-CLOUD public-key="{public_key}" endpoint-address=170.75.168.29 endpoint-port=51820 allowed-address=10.254.30.1/32 persistent-keepalive=25s comment="mesh:cloud:controller" }}; '
                   ':if ([:len [/ip firewall filter find where comment="mesh:cloud:ssh-only"]] = 0) do={ '
                   '/ip firewall filter add chain=input action=accept protocol=tcp src-address=10.254.30.1 dst-address=10.20.0.1 in-interface=KM-MESH-CLOUD dst-port=22 place-before=[find where comment="defconf: drop all not coming from LAN"] comment="mesh:cloud:ssh-only" } }')
        # The service restriction is separate from the firewall. Preserve the
        # existing workstation allowlist and add only this tunnel endpoint.
        router_run(router, '{ :local s [/ip service find where name="ssh" and dynamic=no]; '
                   ':local a [:tostr [/ip service get $s address]]; '
                   ':if ([:typeof [:find $a "10.254.30.1/32"]] = "nil") do={ '
                   ':if ([:len $a] = 0) do={ :error "SSH service must already have a restricted allowlist" }; '
                   '/ip service set $s address=($a . ",10.254.30.1/32") } }')
        router_public_key = router_run(router, ':put [/interface wireguard get [find name="KM-MESH-CLOUD"] public-key]')
        if len(base64.b64decode(router_public_key)) != 32:
            raise RuntimeError("Router public key unavailable")
        config = {key: env[key] for key in ["MESH_ROUTER_SERVICE_KEY", "MIKROTIK_USERNAME", "MIKROTIK_PASSWORD"]}
        config.update(MESH_AUTOMATIC_AGENT_ENABLED="true", MESH_AGENT_MODE="standby", MESH_JOIN_BIND_HOST="10.254.30.1",
                      MESH_PYTHON="/opt/mesh/venv/bin/python", MESH_AGENT_LEDGER_DIRECTORY="/var/lib/mesh/automatic-access")
        if any("\n" in value or "\r" in value or "\0" in value for value in config.values()):
            raise RuntimeError("Unsupported private environment value")
        environment = "".join(f"{key}={json.dumps(value)}\n" for key, value in config.items())
        state = json.loads((PRIVATE / "server.json").read_text())
        release = PRIVATE / "release/gateway-agent"
        unit = '''[Unit]
Description=Afribit Mesh controller (scoped lab enrollment)
After=network-online.target wg-quick@wg-mesh.service
Wants=network-online.target wg-quick@wg-mesh.service

[Service]
Type=simple
User=mesh
Group=mesh
WorkingDirectory=/opt/mesh/current
EnvironmentFile=/etc/mesh/agent.env
ExecStart=/usr/local/bin/node --max-old-space-size=128 /opt/mesh/current/gateway-agent/mesh-daemon.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mesh
UMask=0077
MemoryMax=256M
CPUQuota=20%

[Install]
WantedBy=multi-user.target
'''
        # HTTP until the owner grants Afribit DNS access. TLS will be enabled
        # after DNS points to this VM; do not fabricate a working HTTPS endpoint.
        caddy = '''http://mesh-core.afribit.africa {
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
        install = f'''#!/usr/bin/env bash
set -euo pipefail
install -d -m 0755 /opt/mesh/releases/cloud-pilot-20261006/gateway-agent
install -m 0644 /home/ubuntu/.mesh-stage/mesh-daemon.js /opt/mesh/releases/cloud-pilot-20261006/gateway-agent/mesh-daemon.js
install -m 0644 /home/ubuntu/.mesh-stage/mesh-router.py /opt/mesh/releases/cloud-pilot-20261006/gateway-agent/mesh-router.py
install -m 0644 /home/ubuntu/.mesh-stage/mesh-observer.py /opt/mesh/releases/cloud-pilot-20261006/gateway-agent/mesh-observer.py
install -m 0600 /home/ubuntu/.mesh-stage/agent.env /etc/mesh/agent.env
ln -sfn /opt/mesh/releases/cloud-pilot-20261006 /opt/mesh/current
umask 077
{{ echo '[Interface]'; echo 'Address = 10.254.30.1/30'; echo 'ListenPort = 51820'; printf 'PrivateKey = '; cat /etc/wireguard/mesh-private.key; echo '[Peer]'; echo 'PublicKey = {router_public_key}'; echo 'AllowedIPs = 10.254.30.2/32, 10.20.0.1/32, 10.30.0.0/24'; }} > /etc/wireguard/wg-mesh.conf
install -m 0644 /home/ubuntu/.mesh-stage/mesh-controller.service /etc/systemd/system/mesh-controller.service
systemctl daemon-reload
systemctl enable --now wg-quick@wg-mesh
systemctl enable --now mesh-controller
caddy validate --config /home/ubuntu/.mesh-stage/Caddyfile --adapter caddyfile
install -m 0644 /home/ubuntu/.mesh-stage/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
rm -f /home/ubuntu/.mesh-stage/agent.env
echo 'STANDBY_INSTALL_OK'
'''
        with vm.open_sftp() as sftp:
            sftp.put(str(release / "mesh-daemon.js"), "/home/ubuntu/.mesh-stage/mesh-daemon.js")
            sftp.put(str(ROOT / "gateway-agent/mesh-router.py"), "/home/ubuntu/.mesh-stage/mesh-router.py")
            sftp.put(str(ROOT / "gateway-agent/mesh-observer.py"), "/home/ubuntu/.mesh-stage/mesh-observer.py")
            for name, content in [("agent.env", environment), ("mesh-controller.service", unit), ("Caddyfile", caddy), ("install.sh", install)]:
                upload_text(sftp, "/home/ubuntu/.mesh-stage/" + name, content)
        code, out, error = remote.execute(vm, "sudo bash /home/ubuntu/.mesh-stage/install.sh")
        if code:
            raise RuntimeError("Standby installation failed; inspect service status (no raw private output)")
        evidence = {"server": state["hostname"], "ip": state["public_ip"], "mode": "standby",
                    "customerRedirectChanged": False, "oldControllerStopped": False,
                    "publicTLS": False, "vmWireGuardPublicKey": public_key, "routerWireGuardPublicKey": router_public_key}
        (PRIVATE / "standby-install.json").write_text(json.dumps(evidence, indent=2) + "\n")
        print(json.dumps({key: value for key, value in evidence.items() if "Key" not in key}, indent=2))
    finally:
        router.close()
        vm.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else f"Controller staging stopped: {type(error).__name__}; inspect private state")
        raise SystemExit(1)
