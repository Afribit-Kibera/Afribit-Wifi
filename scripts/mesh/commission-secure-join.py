"""Commission guest-attested HTTPS on the exact enrolled Primary.

Inspect-only by default. --apply changes only the controller join transport and
its named router overlay; no payments, access grants or ledger migration. Every
previous configuration is retained privately. --rollback BACKUP restores the
controller in standby and disables purchases; it never re-enables plaintext
customer onboarding. Review a rollback before resuming automatic activation.
"""
import argparse
import base64
import hashlib
import importlib.util
import json
import re
import shlex
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/secure-join"
HTTPS = "https://mesh-core.afribit.africa/start"
LEGACY = "http://10.20.0.10:8040/start"
PREFIX = "mesh:cloud:join-tls-"
OWNED = {
    "/ip firewall raw": [PREFIX + "raw", PREFIX + "http-local-deny", PREFIX + "http-cloud-deny"],
    "/ip firewall nat": [PREFIX + "dnat"],
    "/ip firewall filter": [PREFIX + "out", PREFIX + "return"],
    "/ip hotspot walled-garden ip": [PREFIX + "garden-original", PREFIX + "garden-translated"],
}
LEGACY_RULES = {
    "/ip firewall nat": ["mesh:cloud:join-dnat"],
    "/ip firewall filter": ["mesh:cloud:join-out", "mesh:cloud:join-return", "mesh:auto:join-bridge", "mesh:auto:join-return"],
    "/ip hotspot walled-garden ip": ["mesh:cloud:join-garden", "mesh:auto:join-bridge"],
}
ACTIVATION_PRIVATE = PRIVATE / "activation"


def activation_record(backup, current_release, daemon_hash):
    """Validate a completed TLS installation, never a failed preflight backup."""
    path = backup.resolve()
    if path.parent != PRIVATE.resolve() or not re.fullmatch(r"\d{8}T\d{6}Z", path.name):
        raise RuntimeError("Activation target is outside completed secure-join backups")
    record = json.loads((path / "verification.json").read_text())
    expected_release = "/opt/mesh/releases/secure-join-" + path.name
    if record.get("applied") is not True or record.get("joinUrl") != HTTPS or record.get("httpJoinEnabled") is not False or \
            record.get("ledgerChanged") is not False or record.get("release") != expected_release or current_release != expected_release or \
            not re.fullmatch(r"[a-f0-9]{64}", record.get("daemonSha256", "")) or record["daemonSha256"] != daemon_hash:
        raise RuntimeError("Current TLS release does not match retained verified installation")
    return record


def validate_caddy_join(adapted):
    """Require actual peer matching and exact overwrite before the denial fallback."""
    try:
        servers = adapted["apps"]["http"]["servers"]
        matches = []
        for server in servers.values():
            for site in server.get("routes", []):
                if site.get("match") != [{"host": ["mesh-core.afribit.africa"]}]:
                    continue
                routes = site["handle"][0]["routes"]
                matches += [route for route in routes if route.get("match") == [{"path": ["/start"]}]]
        if len(matches) != 1:
            raise ValueError()
        ordered = matches[0]["handle"][0]["routes"]
        if len(ordered) != 2 or ordered[0].get("match") != [{"remote_ip": {"ranges": ["10.30.0.0/24"]}}] or ordered[1].get("match"):
            raise ValueError()
        proxy = ordered[0]["handle"][0]["routes"][0]["handle"][0]
        request = proxy["headers"]["request"]
        if proxy["handler"] != "reverse_proxy" or proxy["upstreams"] != [{"dial": "127.0.0.1:8040"}] or \
                request["set"].get("X-Mesh-Client-Ip") != ["{http.request.remote.host}"] or \
                request["set"].get("X-Mesh-Proxy-Tls") != ["1"]:
            raise ValueError()
        denial = ordered[1]["handle"][0]["routes"][0]["handle"][0]
        if denial["handler"] != "static_response" or denial["status_code"] != 403:
            raise ValueError()
    except (KeyError, TypeError, ValueError, IndexError):
        raise RuntimeError("Installed TLS proxy route differs from the reviewed guest-only transport") from None


def billing_configuration(content, enabled):
    """Change only one unquoted public capability in the known scoped config."""
    text = content.decode("utf-8")
    if "KM-LAB-001" not in text or HTTPS not in text or LEGACY in text:
        raise RuntimeError("Existing TLS site configuration is not scoped to enrolled Primary")
    if len(re.findall(r"\bbillingReady\s*:\s*(?:true|false)\b", text)) != 1:
        raise RuntimeError("Expected exactly one public billing capability")
    return re.sub(r"(\bbillingReady\s*:\s*)(?:true|false)\b", r"\1" + ("true" if enabled else "false"), text).encode("utf-8")


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def router_via_vm(stage, vm):
    # The outer SSH connection is pinned by lunanode_remote.py; its tunnel
    # carries a separate end-to-end pinned RouterOS SSH handshake. Password
    # authentication remains inside that encrypted router session. No local
    # credentials/private keys are uploaded or handed to a shell on the VM.
    tunnel = vm.get_transport().open_channel("direct-tcpip", ("10.20.0.1", 22), ("10.254.30.1", 0), timeout=15)
    class PinnedRouter(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            actual = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
            if actual != stage.PIN:
                raise paramiko.SSHException("Secure join tunneled router key mismatch")
            client.get_host_keys().add(hostname, key.get_name(), key)
    router = paramiko.SSHClient()
    router.set_missing_host_key_policy(PinnedRouter())
    env = stage.env_values()
    try:
        router.connect("10.20.0.1", port=22, sock=tunnel, username=env["MIKROTIK_USERNAME"],
                       password=env["MIKROTIK_PASSWORD"], look_for_keys=False, allow_agent=False,
                       timeout=15, auth_timeout=15, banner_timeout=15)
        return router
    except Exception:
        router.close()
        tunnel.close()
        raise


def checked(remote, vm, command):
    code, result, _ = remote.execute(vm, command)
    if code:
        phase = "server-operation"
        if command.startswith("readlink "):
            phase = "current-release-inspection"
        elif command.startswith("sudo cat /etc/caddy/"):
            phase = "current-tls-inspection"
        elif "secure-join-backups/" in command:
            phase = "private-backup"
        elif "caddy validate" in command:
            phase = "staged-caddy-validation"
        elif "secure-join-install.sh" in command:
            phase = "controller-tls-cutover"
        elif "secure-join-rollback.sh" in command:
            phase = "scoped-rollback"
        raise RuntimeError("Secure join VM phase " + phase + " unconfirmed; inspect private state")
    return result.strip()


def router_checked(router, command):
    # RouterOS may put parse/permission errors on stdout and still exit zero.
    # Never echo that raw stream: exported configuration may contain secrets.
    _, out, err = router.exec_command(command, timeout=30)
    result, errors = out.read().decode(), err.read().decode()
    exit_code = out.channel.recv_exit_status()
    failures = ("failure:", "syntax error", "expected end of command", "bad command name", "no such item",
                "invalid value", "input does not match", "not enough permissions", "error:")
    if exit_code != 0 or errors.strip() or any(value in result.lower() for value in failures):
        # Named phase only; never include an arbitrary command or router output.
        phase = "snapshot" if command.startswith("/export ") else "scope-query"
        for table in ("/ip firewall raw", "/ip firewall nat", "/ip firewall filter", "/ip hotspot walled-garden ip"):
            if command.startswith(table):
                phase = table.removeprefix("/ip ").replace(" ", "-")
                for operation in ("add", "disable", "remove"):
                    if command.startswith(table + " " + operation):
                        phase += "-" + operation
                        break
                break
        raise RuntimeError("Secure join RouterOS phase " + phase + " unconfirmed; inspect private state")
    return result.replace("\r", "").strip()


def upload(vm, path, content):
    with vm.open_sftp() as sftp:
        with sftp.open(path, "w") as target:
            target.write(content)
        sftp.chmod(path, 0o600)


def disable_legacy(stage, router):
    for table, comments in LEGACY_RULES.items():
        for comment in comments:
            guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
            stage.router_run(router, table + ' disable [find where comment="' + comment + '"' + guard + ']')
            if stage.router_run(router, ':put [:len [' + table + ' find where comment="' + comment + '" and disabled=no' + guard + ']]') != "0":
                raise RuntimeError("Legacy plaintext join allowance remains enabled")


def remove_overlay(stage, router):
    for table, comments in OWNED.items():
        for comment in comments:
            guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
            stage.router_run(router, table + ' remove [find where comment="' + comment + '"' + guard + ']')


def enabled_rule_count(stage, router, rules):
    total = 0
    for table, comments in rules.items():
        for comment in comments:
            guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
            total += int(stage.router_run(router, ':put [:len [' + table + ' find where comment="' + comment + '" and disabled=no' + guard + ']]'))
    return total


def portal_read(router):
    with router.open_sftp() as sftp:
        with sftp.open("mesh-captive/site-config.js", "rb") as source:
            return source.read()


def portal_write(router, name, content):
    with router.open_sftp() as sftp:
        with sftp.open("mesh-captive/" + name, "wb") as target:
            target.write(content)
        with sftp.open("mesh-captive/" + name, "rb") as source:
            if source.read() != content:
                raise RuntimeError("Secure portal upload could not be verified")


def verify_laptop_worker_disabled():
    # This lab commissioner runs from the original Windows operator laptop.
    # Never resume it or allow another worker to claim from a stale ledger.
    if sys.platform != "win32":
        raise RuntimeError("Use the original Windows operator host to verify its disabled worker")
    script = "$kmTask=Get-ScheduledTask -TaskName AfribitMeshAutomaticAccess -ErrorAction Stop; " \
        "$kmProcesses=Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*gateway-agent*mesh-daemon.*' }; " \
        "if ($kmTask.Settings.Enabled -or $kmTask.State -ne 'Disabled' -or $kmProcesses) { exit 1 }; Write-Output 'DISABLED'"
    result = subprocess.run(["powershell.exe", "-NoProfile", "-Command", script], capture_output=True, text=True)
    if result.returncode != 0 or result.stdout.strip() != "DISABLED":
        raise RuntimeError("Original laptop worker is not confirmed disabled; inspect before commissioning")


def scoped_state(stage, router, remote, vm):
    verify_laptop_worker_disabled()
    identity = stage.router_run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
    if identity.splitlines() != ["KM-LAB-001", "HH70A8H82EG"]:
        raise RuntimeError("Unexpected enrolled router identity")
    prior = checked(remote, vm, "readlink -f /opt/mesh/current")
    if not re.fullmatch(r"/opt/mesh/releases/[A-Za-z0-9_-]+", prior):
        raise RuntimeError("Unexpected controller release path")
    caddy = checked(remote, vm, "sudo cat /etc/caddy/Caddyfile") + "\n"
    if "mesh-core.afribit.africa {" not in caddy or "trusted_proxies" in caddy:
        raise RuntimeError("Review the existing TLS proxy configuration before commissioning")
    portal = portal_read(router)
    if "KM-LAB-001" not in portal.decode() or not any(url in portal.decode() for url in (LEGACY, HTTPS)):
        raise RuntimeError("Enrolled portal configuration unavailable")
    return prior, caddy, portal


def rollback(stage, router, remote, vm, backup):
    resolved = backup.resolve()
    if resolved.parent != PRIVATE.resolve() or not re.fullmatch(r"\d{8}T\d{6}Z", resolved.name):
        raise RuntimeError("Rollback target is outside the retained secure-join backups")
    state = json.loads((resolved / "before.json").read_text())
    prior, remote_backup = state["previousRelease"], state["vmBackup"]
    if not re.fullmatch(r"/opt/mesh/releases/[A-Za-z0-9_-]+", prior) or remote_backup != "/var/lib/mesh/secure-join-backups/" + resolved.name:
        raise RuntimeError("Invalid retained rollback metadata")
    # A rollback deliberately stops new purchases and claims. Neither the old
    # HTTP overlay nor a second/laptop worker is automatically enabled.
    disable_legacy(stage, router)
    config = portal_read(router).decode()
    config = re.sub(r"(billingReady\s*:\s*)true", r"\1false", config)
    portal_write(router, "site-config.js", config.encode())
    remove_overlay(stage, router)
    script = f'''set -euo pipefail
systemctl stop mesh-controller
install -m 0600 {remote_backup}/agent.env /etc/mesh/agent.env
python3 - <<'PY'
from pathlib import Path
p=Path('/etc/mesh/agent.env')
s=p.read_text().splitlines()
s=[line for line in s if not line.startswith('MESH_AGENT_MODE=')]
s.append('MESH_AGENT_MODE="standby"')
p.write_text('\\n'.join(s)+'\\n')
PY
ln -sfn {prior} /opt/mesh/current
install -m 0644 {remote_backup}/Caddyfile /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1
systemctl reload caddy
systemctl start mesh-controller
'''
    upload(vm, "/home/ubuntu/.mesh-stage/secure-join-rollback.sh", script)
    checked(remote, vm, "sudo bash /home/ubuntu/.mesh-stage/secure-join-rollback.sh")
    report = {"rolledBack": True, "controllerMode": "standby", "purchaseEnabled": False,
              "httpJoinReenabled": False, "ledgerChanged": False}
    (resolved / "rollback.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def require_private_router_tunnel(remote, vm):
    # Cloud API health is independent of the router tunnel. Do not enable
    # purchases merely because the controller can reach the website.
    try:
        code, _, _ = remote.execute(vm, "python3 - <<'PY'\nimport socket\ns = socket.create_connection(('10.20.0.1', 22), timeout=8)\ns.close()\nPY", timeout=15)
    except Exception:
        raise RuntimeError("Private router tunnel unavailable; secure join commissioning stopped before mutation") from None
    if code != 0:
        raise RuntimeError("Private router tunnel unavailable; secure join commissioning stopped before mutation")


def verify_existing_overlay(stage, router):
    rules = [
        ("/ip firewall raw", PREFIX + "raw", {"chain": "prerouting", "action": "accept", "in-interface": "mesh-customer-30", "src-address": "10.30.0.0/24", "dst-address": "170.75.168.29", "protocol": "tcp", "dst-port": "443"}),
        ("/ip firewall raw", PREFIX + "http-local-deny", {"chain": "prerouting", "action": "drop", "in-interface": "mesh-customer-30", "src-address": "10.30.0.0/24", "dst-address": "10.20.0.10", "protocol": "tcp", "dst-port": "8040"}),
        ("/ip firewall raw", PREFIX + "http-cloud-deny", {"chain": "prerouting", "action": "drop", "in-interface": "mesh-customer-30", "src-address": "10.30.0.0/24", "dst-address": "10.254.30.1", "protocol": "tcp", "dst-port": "8040"}),
        ("/ip firewall nat", PREFIX + "dnat", {"chain": "dstnat", "action": "dst-nat", "in-interface": "mesh-customer-30", "src-address": "10.30.0.0/24", "dst-address": "170.75.168.29", "protocol": "tcp", "dst-port": "443", "to-addresses": "10.254.30.1", "to-ports": "443"}),
        ("/ip firewall filter", PREFIX + "out", {"chain": "KM-MESH-OUT", "action": "accept", "out-interface": "KM-MESH-CLOUD", "src-address": "10.30.0.0/24", "dst-address": "10.254.30.1", "protocol": "tcp", "dst-port": "443"}),
        ("/ip firewall filter", PREFIX + "return", {"chain": "KM-MESH-IN", "action": "accept", "in-interface": "KM-MESH-CLOUD", "src-address": "10.254.30.1", "dst-address": "10.30.0.0/24", "protocol": "tcp", "src-port": "443", "connection-state": "established,related"}),
        ("/ip hotspot walled-garden ip", PREFIX + "garden-original", {"server": "KM-MESH-001", "action": "accept", "src-address": "10.30.0.0/24", "dst-address": "170.75.168.29", "protocol": "tcp", "dst-port": "443"}),
        ("/ip hotspot walled-garden ip", PREFIX + "garden-translated", {"server": "KM-MESH-001", "action": "accept", "src-address": "10.30.0.0/24", "dst-address": "10.254.30.1", "protocol": "tcp", "dst-port": "443"}),
    ]
    for table, comment, fields in rules:
        guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
        command = '{ :local kmRule [' + table + ' find where comment="' + comment + '"' + guard + ']; '
        command += ':if ([:len $kmRule] != 1) do={ :error "Expected one owned TLS rule" }; '
        fields = {"disabled": "false", **fields}
        condition = " || ".join('[:tostr [' + table + ' get $kmRule ' + key + ']] != "' + value + '"' for key, value in fields.items())
        command += ':if (' + condition + ') do={ :error "Owned TLS rule scope changed" }; :put "SCOPED" }'
        if stage.router_run(router, command) != "SCOPED":
            raise RuntimeError("Existing TLS router scope unconfirmed")
    for table, comments in LEGACY_RULES.items():
        for comment in comments:
            guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
            query = table + ' find where comment="' + comment + '"' + guard
            if stage.router_run(router, ':put [:len [' + query + ']]') != "1" or \
                    stage.router_run(router, ':put [' + table + ' get [' + query + '] disabled]') != "true":
                raise RuntimeError("Original plaintext join rule is missing or enabled")
    for suffix, address in (("original", "170.75.168.29"), ("translated", "10.254.30.1")):
        comment = PREFIX + "garden-" + suffix
        # RouterOS enum find values must be quoted; unquoted tcp can silently
        # match nothing even though readback prints the expected protocol.
        common = 'dynamic=yes and disabled=no and comment="' + comment + '" and action="return" and protocol="tcp"'
        checks = [
            ('/ip firewall nat', common + ' and chain="hs-unauth" and src-address="10.30.0.0/24" and dst-address="' + address + '" and dst-port="443" and in-interface="mesh-customer-30"'),
            ('/ip firewall filter', common + ' and chain="hs-unauth" and src-address="10.30.0.0/24" and dst-address="' + address + '" and dst-port="443" and in-interface="mesh-customer-30"'),
            ('/ip firewall filter', common + ' and chain="hs-unauth-to" and src-address="' + address + '" and dst-address="10.30.0.0/24" and src-port="443" and out-interface="mesh-customer-30"'),
        ]
        for table, query in checks:
            if stage.router_run(router, ':put [:len [' + table + ' find where ' + query + ']]') != "1":
                raise RuntimeError("Native TLS walled-garden child scope unconfirmed")


def verify_vm_tls_state(remote, vm):
    command = "sudo python3 - <<'PY'\nfrom pathlib import Path\nimport json\ne={}\nfor line in Path('/etc/mesh/agent.env').read_text().splitlines():\n if '=' in line:\n  key,value=line.split('=',1)\n  if key in ('MESH_JOIN_BIND_HOST','MESH_JOIN_TRANSPORT','MESH_AGENT_MODE'):\n   e[key]=value.strip().strip(chr(34)).strip(chr(39))\nprint(json.dumps(e))\nPY"
    state = json.loads(checked(remote, vm, command))
    if state.get("MESH_JOIN_BIND_HOST") != "127.0.0.1" or state.get("MESH_JOIN_TRANSPORT") != "trusted-tls-proxy" or \
            state.get("MESH_AGENT_MODE") not in ("standby", "active"):
        raise RuntimeError("Existing daemon is not configured for the reviewed TLS transport")
    if checked(remote, vm, "pgrep -fc '[m]esh-daemon.js'") != "1":
        raise RuntimeError("Expected exactly one existing TLS controller")
    return state


def verify_negative_join_paths(remote, vm):
    # No guest address is sent with the TLS marker to a trusted local socket:
    # all these requests must be rejected without observing a customer or
    # generating a context. Only statuses are printed, never response secrets.
    command = """python3 - <<'PY'
import http.client,json
checks=[('mesh-core.afribit.africa',443,True,{'X-Mesh-Client-IP':'10.30.0.197','X-Mesh-Proxy-TLS':'1','X-Forwarded-For':'10.30.0.197'}),
('127.0.0.1',8040,False,{}),('127.0.0.1',8040,False,{'X-Mesh-Client-IP':'10.20.0.1','X-Mesh-Proxy-TLS':'1'}),
('127.0.0.1',8040,False,{'X-Mesh-Client-IP':'10.30.0.197, 10.30.0.198','X-Mesh-Proxy-TLS':'1'})]
results=[]
for host,port,tls,headers in checks:
 c=(http.client.HTTPSConnection if tls else http.client.HTTPConnection)(host,port,timeout=8)
 c.request('GET','/start',headers=headers);r=c.getresponse()
 results.append({'status':r.status,'hasLocation':r.getheader('Location') is not None});r.read(1024);c.close()
print(json.dumps(results))
PY"""
    code, result, _ = remote.execute(vm, command, timeout=45)
    if code:
        raise RuntimeError("TLS negative request checks unconfirmed")
    outcomes = json.loads(result)
    if outcomes != [{"status": 403, "hasLocation": False}] * 4:
        raise RuntimeError("TLS join accepted a non-guest or malformed attestation")


def verify_public_join_denial(remote, vm):
    command = """python3 - <<'PY'
import http.client,json
c=http.client.HTTPSConnection('mesh-core.afribit.africa',443,timeout=8)
c.request('GET','/start',headers={'X-Mesh-Client-IP':'10.30.0.197','X-Mesh-Proxy-TLS':'1','X-Forwarded-For':'10.30.0.197'})
r=c.getresponse();print(json.dumps({'status':r.status,'hasLocation':r.getheader('Location') is not None}));r.read(1024);c.close()
PY"""
    code, result, _ = remote.execute(vm, command, timeout=15)
    if code or json.loads(result) != {"status": 403, "hasLocation": False}:
        raise RuntimeError("Public TLS forged-header denial unconfirmed before activation")


def verify_pinned_vm_router(stage, remote, vm):
    require_private_router_tunnel(remote, vm)
    pinned = router_via_vm(stage, vm)
    try:
        identity = stage.router_run(pinned, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
        if identity.splitlines() != ["KM-LAB-001", "HH70A8H82EG"]:
            raise RuntimeError("Private tunnel router identity does not match enrollment")
    finally:
        pinned.close()


def set_existing_mode(remote, vm, value):
    if value not in ("active", "standby"):
        raise RuntimeError("Invalid controller mode")
    script = "from pathlib import Path\np=Path('/etc/mesh/agent.env')\ns=p.read_text().splitlines()\ns=[x for x in s if not x.startswith('MESH_AGENT_MODE=')]\ns.append('MESH_AGENT_MODE=\"" + value + "\"')\np.write_text('\\n'.join(s)+'\\n')\n"
    upload(vm, "/home/ubuntu/.mesh-stage/secure-join-activate-mode.py", script)
    checked(remote, vm, "sudo python3 /home/ubuntu/.mesh-stage/secure-join-activate-mode.py && sudo systemctl restart mesh-controller")


def activate_handoff(preflight, set_mode, health, recheck, publish):
    """No purchase publishing before transport preflight and fresh rechecks."""
    preflight()
    phase = "controller-mode"
    try:
        set_mode("active")
        phase = "active-health"
        health()
        phase = "fresh-attestation-and-negative-checks"
        recheck()
        phase = "public-capability-publish"
        publish(True)
    except Exception:
        # Attempt both fail-closed operations even if one path is unavailable.
        errors = []
        for operation in (lambda: publish(False), lambda: set_mode("standby")):
            try:
                operation()
            except Exception:
                errors.append(True)
        if errors:
            raise RuntimeError("Existing TLS activation phase " + phase + " incomplete; fail-closed pause unconfirmed") from None
        raise RuntimeError("Existing TLS activation phase " + phase + " incomplete; standby and purchase pause restored") from None


def inspect_existing_activation(stage, router, remote, vm, backup):
    prior, caddy, portal = scoped_state(stage, router, remote, vm)
    paused = billing_configuration(portal, False)
    if portal != paused:
        raise RuntimeError("Existing TLS activation requires an explicitly paused purchase capability")
    digest = checked(remote, vm, "sha256sum " + shlex.quote(prior + "/gateway-agent/mesh-daemon.js")).split()[0]
    record = activation_record(backup, prior, digest)
    verify_vm_tls_state(remote, vm)
    validate_caddy_join(json.loads(checked(remote, vm, "sudo caddy adapt --config /etc/caddy/Caddyfile --adapter caddyfile 2>/dev/null")))
    verify_existing_overlay(stage, router)
    verify_pinned_vm_router(stage, remote, vm)
    verify_public_join_denial(remote, vm)
    return prior, paused, record


def activate_existing(stage, router, remote, vm, backup):
    prior, paused, record = inspect_existing_activation(stage, router, remote, vm, backup)
    # Negative controller checks must be in active mode to reach the handler;
    # standby returns503 before the handler. Caddy public denial can still be
    # checked before activation and all four checks repeat before publishing.
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    retained = ACTIVATION_PRIVATE / timestamp
    retained.mkdir(parents=True, exist_ok=False)
    (retained / "site-config.js").write_bytes(paused)
    vm_backup = "/var/lib/mesh/secure-join-backups/activation-" + timestamp
    checked(remote, vm, "sudo install -d -m0700 " + vm_backup + " && sudo cp /etc/mesh/agent.env " + vm_backup + "/agent.env && sudo chmod 0600 " + vm_backup + "/agent.env")
    def health():
        for _ in range(16):
            time.sleep(2)
            code, body, _ = remote.execute(vm, "curl -fsS http://127.0.0.1:8041/health", timeout=10)
            if code == 0:
                value = json.loads(body)
                if value.get("mode") == "active" and value.get("cloudConnected"):
                    return
        raise RuntimeError("Existing TLS active controller health unconfirmed")
    def recheck():
        verify_laptop_worker_disabled()
        verify_vm_tls_state(remote, vm)
        verify_pinned_vm_router(stage, remote, vm)
        verify_existing_overlay(stage, router)
        verify_negative_join_paths(remote, vm)
    def publish(enabled):
        # Only this capability changes; URLs, host flags and all router policy
        # bytes remain the reviewed paused TLS configuration.
        portal_write(router, "site-config.js", billing_configuration(paused, enabled))
    try:
        activate_handoff(lambda: verify_pinned_vm_router(stage, remote, vm), lambda mode: set_existing_mode(remote, vm, mode), health, recheck, publish)
    except Exception as error:
        (retained / "failure.json").write_text(json.dumps({"outcome": str(error) if isinstance(error, RuntimeError) else type(error).__name__, "ledgerChanged": False}, indent=2) + "\n")
        raise
    report = {"activatedExistingTls": True, "release": record["release"], "purchaseEnabled": True,
              "controllerMode": "active", "privatePinnedRouterVerified": True, "negativeJoinChecksPassed": True,
              "tlsOverlayRecreated": False, "ledgerChanged": False, "paymentInitiated": False,
              "physicalPhoneAcceptance": "pending", "backupDirectory": str(retained.relative_to(ROOT))}
    (retained / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def apply(stage, router, remote, vm, resume_from=None):
    prior, caddy, portal = scoped_state(stage, router, remote, vm)
    require_private_router_tunnel(remote, vm)
    if checked(remote, vm, "pgrep -fc '[m]esh-daemon.js'") != "1":
        raise RuntimeError("Expected one systemd controller worker before secure commissioning")
    if resume_from is not None:
        resume_path = resume_from.resolve()
        if resume_path.parent != PRIVATE.resolve() or not re.fullmatch(r"\d{8}T\d{6}Z", resume_path.name):
            raise RuntimeError("Resume target is outside retained secure-join backups")
        retained = json.loads((resume_path / "before.json").read_text())
        rolled_back = json.loads((resume_path / "rollback.json").read_text())
        if retained.get("previousRelease") != prior or rolled_back.get("controllerMode") != "standby" or rolled_back.get("purchaseEnabled") is not False:
            raise RuntimeError("Resume requires the exact retained fail-closed rollback")
        original_portal = (resume_path / "site-config.js").read_bytes()
        if "KM-LAB-001" not in original_portal.decode() or LEGACY not in original_portal.decode():
            raise RuntimeError("Retained original portal configuration unavailable")
        # Restore billing only after the repaired TLS controller is healthy.
        portal = original_portal
    if "handle /start" in caddy or HTTPS in portal.decode():
        raise RuntimeError("TLS onboarding already or partially commissioned; inspect before repeating")
    for table, comments in OWNED.items():
        for comment in comments:
            if stage.router_run(router, ':put [:len [' + table + ' find where comment="' + comment + '"]]') != "0":
                raise RuntimeError("Secure join overlay already exists; inspect before repeating")
    # No broad policy adjustment is attempted when the known guards changed.
    stage.router_run(router, '{ '
        ':if ([:len [/ip firewall raw find where comment="kibera-mesh-lab:captive:https-pending-deny"]] != 1 || '
        '[:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:private-deny"]] != 1 || '
        '[:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:return-deny"]] != 1 || '
        '[:len [/ip hotspot find where name="KM-MESH-001"]] != 1 || '
        '[:len [/interface find where name="mesh-customer-30"]] != 1 || '
        '[:len [/ip firewall nat find where chain=dstnat and dynamic=yes and action=jump and jump-target=hotspot]] != 1) do={ :error "Unexpected customer policy" } }')
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = PRIVATE / timestamp
    backup.mkdir(parents=True, exist_ok=False)
    remote_backup = "/var/lib/mesh/secure-join-backups/" + timestamp
    release = "/opt/mesh/releases/secure-join-" + timestamp
    (backup / "before.json").write_text(json.dumps({"previousRelease": prior, "vmBackup": remote_backup}, indent=2) + "\n")
    (backup / "site-config.js").write_bytes(portal)
    # RouterOS 7.20 accepts the show-sensitive switch, not '=no'. Omit it:
    # secrets are hidden by default. Strict command checking caught the old
    # invalid syntax before any runtime mutation.
    (backup / "router-before.rsc").write_text(stage.router_run(router, "/export terse"))
    with router.open_sftp() as sftp:
        for name in ("login.html", "mesh.html"):
            with sftp.open("mesh-captive/" + name, "rb") as source:
                (backup / name).write_bytes(source.read())
    # Expand no root-only directory glob in the unprivileged SSH shell: it
    # would remain a literal '*' and report an ambiguous backup failure.
    checked(remote, vm, f"sudo install -d -m 0700 {remote_backup} && sudo cp /etc/mesh/agent.env /etc/caddy/Caddyfile {remote_backup}/ && sudo chmod 0600 {remote_backup}/agent.env {remote_backup}/Caddyfile")
    # This exact guest-only matcher uses the true TLS peer, not client headers.
    join_route = '''    handle /start {
        @guestJoin remote_ip 10.30.0.0/24
        handle @guestJoin {
            reverse_proxy 127.0.0.1:8040 {
                header_up X-Mesh-Client-IP {http.request.remote.host}
                header_up X-Mesh-Proxy-TLS "1"
                header_up -X-Forwarded-For
                header_up -X-Real-IP
            }
        }
        handle {
            respond "Join Mesh Wi-Fi to continue" 403
        }
    }
'''
    desired_caddy = caddy.replace("    handle {", join_route + "    handle {", 1)
    if desired_caddy == caddy:
        raise RuntimeError("Existing Caddy fallback differs; review manually")
    upload(vm, "/home/ubuntu/.mesh-stage/secure-join.Caddyfile", desired_caddy)
    checked(remote, vm, "sudo caddy validate --config /home/ubuntu/.mesh-stage/secure-join.Caddyfile --adapter caddyfile >/dev/null 2>&1")
    bundle = backup / "mesh-daemon.js"
    built = subprocess.run(["npx.cmd", "esbuild", "gateway-agent/mesh-daemon.ts", "--bundle", "--platform=node", "--format=cjs", "--target=node22", "--outfile=" + str(bundle)], cwd=ROOT, capture_output=True)
    if built.returncode:
        raise RuntimeError("Tested controller bundle could not be built")
    with vm.open_sftp() as sftp:
        sftp.put(str(bundle), "/home/ubuntu/.mesh-stage/secure-join.js")
    install = f'''set -euo pipefail
install -d -m 0755 {release}/gateway-agent
install -m 0644 /home/ubuntu/.mesh-stage/secure-join.js {release}/gateway-agent/mesh-daemon.js
install -m 0644 {prior}/gateway-agent/mesh-router.py {release}/gateway-agent/mesh-router.py
install -m 0644 {prior}/gateway-agent/mesh-observer.py {release}/gateway-agent/mesh-observer.py
systemctl stop mesh-controller
python3 - <<'PY'
from pathlib import Path
p=Path('/etc/mesh/agent.env')
s=p.read_text().splitlines()
s=[line for line in s if not line.startswith(('MESH_JOIN_BIND_HOST=', 'MESH_JOIN_TRANSPORT=', 'MESH_AGENT_MODE='))]
s.extend(['MESH_JOIN_BIND_HOST="127.0.0.1"', 'MESH_JOIN_TRANSPORT="trusted-tls-proxy"', 'MESH_AGENT_MODE="active"'])
p.write_text('\\n'.join(s)+'\\n')
PY
ln -sfn {release} /opt/mesh/current
install -m 0644 /home/ubuntu/.mesh-stage/secure-join.Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
systemctl start mesh-controller
'''
    upload(vm, "/home/ubuntu/.mesh-stage/secure-join-install.sh", install)
    try:
        disable_legacy(stage, router)
        checked(remote, vm, "sudo bash /home/ubuntu/.mesh-stage/secure-join-install.sh")
        for _ in range(16):
            time.sleep(2)
            code, body, _ = remote.execute(vm, "curl -fsS http://127.0.0.1:8041/health")
            if code == 0 and json.loads(body).get("cloudConnected") and json.loads(body).get("mode") == "active":
                break
        else:
            raise RuntimeError("Secure controller health unconfirmed")
        # UFW already exposes Caddy 443. This translates only guest TCP443 for
        # the exact site; it preserves 10.30.0.x through the WireGuard peer.
        commands = [
            '/ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address=10.20.0.10 protocol=tcp dst-port=8040 action=drop place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="' + PREFIX + 'http-local-deny"',
            '/ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address=10.254.30.1 protocol=tcp dst-port=8040 action=drop place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="' + PREFIX + 'http-cloud-deny"',
            '/ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address=170.75.168.29 protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="' + PREFIX + 'raw"',
            '/ip hotspot walled-garden ip add server=KM-MESH-001 src-address=10.30.0.0/24 dst-address=170.75.168.29 protocol=tcp dst-port=443 action=accept comment="' + PREFIX + 'garden-original"',
            '/ip hotspot walled-garden ip add server=KM-MESH-001 src-address=10.30.0.0/24 dst-address=10.254.30.1 protocol=tcp dst-port=443 action=accept comment="' + PREFIX + 'garden-translated"',
            '/ip firewall filter add chain=KM-MESH-OUT src-address=10.30.0.0/24 dst-address=10.254.30.1 out-interface=KM-MESH-CLOUD protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:private-deny"] comment="' + PREFIX + 'out"',
            '/ip firewall filter add chain=KM-MESH-IN src-address=10.254.30.1 dst-address=10.30.0.0/24 in-interface=KM-MESH-CLOUD protocol=tcp src-port=443 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="' + PREFIX + 'return"',
            '/ip firewall nat add chain=dstnat src-address=10.30.0.0/24 in-interface=mesh-customer-30 dst-address=170.75.168.29 protocol=tcp dst-port=443 action=dst-nat to-addresses=10.254.30.1 to-ports=443 place-before=[find where chain=dstnat and dynamic=yes and action=jump and jump-target=hotspot] comment="' + PREFIX + 'dnat"',
        ]
        for command in commands:
            stage.router_run(router, command)
        for table, comments in OWNED.items():
            for comment in comments:
                guard = '' if table == '/ip hotspot walled-garden ip' else ' and dynamic=no'
                if stage.router_run(router, ':put [:len [' + table + ' find where comment="' + comment + '"' + guard + ']]') != "1":
                    raise RuntimeError("Secure join overlay verification failed")
        # Publish only when the TLS terminator and local attestor are ready.
        for name in ("login.html", "mesh.html"):
            portal_write(router, name, (ROOT / "mikrotik/hotspot-mesh" / name).read_bytes())
        desired_portal = portal.decode().replace(LEGACY, HTTPS).encode()
        portal_write(router, "site-config.js", desired_portal)
        report = {"applied": True, "joinUrl": HTTPS, "release": release, "previousRelease": prior,
                  "backupDirectory": str(backup.relative_to(ROOT)), "httpJoinEnabled": False,
                  "ledgerChanged": False, "laptopWorkerDisabled": True, "paymentInitiated": False, "paidAccessGranted": False,
                  "phoneAcceptance": "pending", "daemonSha256": hashlib.sha256(bundle.read_bytes()).hexdigest()}
        (backup / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
        return report
    except Exception as original:
        # Retain only our own sanitized phase errors, never arbitrary library
        # messages that can contain credentials or response URLs.
        failure = str(original) if isinstance(original, RuntimeError) else type(original).__name__
        (backup / "failure.json").write_text(json.dumps({"phase": failure, "runtimeMutationStarted": True}, indent=2) + "\n")
        try:
            rollback(stage, router, remote, vm, backup)
        except Exception:
            raise RuntimeError("Secure join incomplete and rollback unconfirmed; retained backup: " + str(backup.relative_to(ROOT))) from None
        raise RuntimeError("Secure join incomplete (" + failure + "); restored controller standby, purchases disabled, HTTP remains blocked; backup: " + str(backup.relative_to(ROOT))) from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true")
    mode.add_argument("--rollback", type=Path)
    mode.add_argument("--resume", type=Path)
    mode.add_argument("--activate-existing", type=Path, help="Activate a verified installed TLS release after its private tunnel is restored; never recreate the overlay")
    mode.add_argument("--check-activation", type=Path, help="Read-only preflight for the existing paused TLS release")
    parser.add_argument("--via-vm", action="store_true", help="End-to-end pinned router SSH through the existing pinned VM/WireGuard tunnel")
    parser.add_argument("--source-address", help="Optional local home-network IPv4 source for pinned VM SSH")
    args = parser.parse_args()
    stage = module("secure_join_stage", "stage-lunanode-controller.py")
    stage.router_run = router_checked
    remote = module("secure_join_remote", "lunanode_remote.py")
    vm = remote.connect(args.source_address)
    router = router_via_vm(stage, vm) if args.via_vm else stage.router_connect(stage.env_values())
    try:
        prior, caddy, portal = scoped_state(stage, router, remote, vm)
        if args.check_activation:
            release, _, _ = inspect_existing_activation(stage, router, remote, vm, args.check_activation)
            report = {"existingTlsActivationPreflightPassed": True, "release": release, "applied": False,
                      "privatePinnedRouterVerified": True, "publicForgedHeadersDenied": True,
                      "overlayChanged": False, "ledgerChanged": False, "paymentInitiated": False}
        elif args.activate_existing:
            report = activate_existing(stage, router, remote, vm, args.activate_existing)
        elif args.apply or args.resume:
            report = apply(stage, router, remote, vm, args.resume)
        elif args.rollback:
            report = rollback(stage, router, remote, vm, args.rollback)
        else:
            report = {"applied": False, "routerId": "KM-LAB-001", "currentRelease": prior,
                      "httpsRoutePresent": "handle /start" in caddy, "portalUsesHttps": HTTPS in portal.decode(),
                      "legacyHttpRuleEnabledCount": enabled_rule_count(stage, router, LEGACY_RULES),
                      "ownedHttpsRuleEnabledCount": enabled_rule_count(stage, router, OWNED),
                      "laptopWorkerDisabled": True,
                      "intendedJoinUrl": HTTPS, "ledgerChanged": False, "paymentInitiated": False}
        print(json.dumps(report, indent=2))
    finally:
        router.close()
        vm.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else "Secure join operation unconfirmed; inspect retained private state")
        raise SystemExit(1)
