"""What unpaid Mesh devices may use: Signal, Blink and the learning sites.

The list lives in lib/free-access.json, which the portal also reads. Customers
on 10.30.0.0/24 may open TCP 443 to those hosts and nothing else. Every rule
carries a "mesh:free:" comment, so re-running replaces exactly these rules and
leaves the rest of the policy alone.

Hosts are resolved to IPv4 addresses by the router. Where a host shares its
address with other sites, those sites become reachable too; keep the list to
hosts on their own addresses where possible.

Live router (inspect by default, --apply to change):
  MESH_ROUTER_HOST_KEY=SHA256:... MESH_ROUTER_SERIAL=... \\
    python scripts/mesh/free_access.py ADMIN_PASSWORD_FILE [--apply]

The router is reached over the controller's WireGuard link through
`ssh proxmox-main "pct exec 110 -- nc 10.254.30.11 22"`, so the admin
password stays on this machine.
"""
import base64
import hashlib
import json
import logging
import os
import re
import socket
import subprocess
import sys
import threading
from pathlib import Path

POLICY = json.loads((Path(__file__).resolve().parents[2] / "lib" / "free-access.json").read_text(encoding="utf-8"))
HOSTS = tuple(dict.fromkeys(host for item in POLICY["apps"] + POLICY["sites"] for host in item["hosts"]))
LIST = "KM-MESH-FREE"
TAG = "mesh:free:"
# Earlier, separate allowances that this one replaces.
OLD_TAGS = ("mesh:pay:blink-", "mesh:signal:text-", "mesh:learn:", "mesh:blink:")
OLD_LISTS = ("KM-MESH-PAY-BLINK", "KM-MESH-SIGNAL-TEXT", "KM-MESH-LEARN", "KM-MESH-BLINK-CORE")
CUSTOMERS = "10.30.0.0/24"
ROUTER = "10.254.30.11"
RELAY = ["ssh", "-o", "BatchMode=yes", "proxmox-main", f"pct exec 110 -- nc {ROUTER} 22"]


def remove_commands():
    """Removes this allowance and the older ones it replaces."""
    lines = []
    for tag in (TAG, *OLD_TAGS):
        owned = f'[find where comment~"^{tag}"]'
        lines += [f"/ip firewall raw remove {owned}", f"/ip firewall filter remove {owned}",
                  f"/ip hotspot walled-garden ip remove {owned}"]
    for name in (LIST, *OLD_LISTS):
        lines.append(f'/ip firewall address-list remove [find where list="{name}"]')
    return lines


def install_commands():
    """Installs the allowance on a router that has the captive policy."""
    lines = []
    for host in HOSTS:
        lines.append(f'/ip firewall address-list add list={LIST} address={host} comment="{TAG}host"')
        lines.append(f'/ip hotspot walled-garden ip add server=KM-MESH-001 src-address={CUSTOMERS} dst-host={host} '
                     f'protocol=tcp dst-port=443 action=accept comment="{TAG}garden"')
    lines += [
        f'/ip firewall raw add chain=prerouting action=accept in-interface=mesh-customer-30 src-address={CUSTOMERS} '
        f'dst-address-list={LIST} protocol=tcp dst-port=443 '
        f'place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="{TAG}https"',
        f'/ip firewall filter add chain=KM-MESH-OUT action=accept in-interface=mesh-customer-30 out-interface=ether1 '
        f'src-address={CUSTOMERS} dst-address-list={LIST} protocol=tcp dst-port=443 '
        f'place-before=[find where comment="kibera-mesh-lab:captive:internet-pending-deny"] comment="{TAG}out"',
        f'/ip firewall filter add chain=KM-MESH-IN action=accept in-interface=ether1 out-interface=mesh-customer-30 '
        f'dst-address={CUSTOMERS} src-address-list={LIST} protocol=tcp src-port=443 connection-state=established,related '
        f'place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="{TAG}return"',
    ]
    return lines


def check():
    """Fails unless exactly this allowance is installed."""
    return (f':if ([:len [/ip firewall raw find where comment="{TAG}https"]] != 1 || '
            f'[:len [/ip firewall filter find where comment="{TAG}out"]] != 1 || '
            f'[:len [/ip firewall filter find where comment="{TAG}return"]] != 1 || '
            f'[:len [/ip hotspot walled-garden ip find where comment="{TAG}garden"]] != {len(HOSTS)}) '
            f'do={{ :error "Free access incomplete" }}; :put "MESH_FREE_ACCESS_OK"')


def connect(password):
    import paramiko
    logging.getLogger("paramiko").disabled = True
    pin, serial = os.environ.get("MESH_ROUTER_HOST_KEY", ""), os.environ.get("MESH_ROUTER_SERIAL", "")
    if not re.fullmatch(r"SHA256:[A-Za-z0-9+/]{43}", pin) or not re.fullmatch(r"[A-Z0-9]{8,16}", serial):
        raise SystemExit("Set MESH_ROUTER_HOST_KEY and MESH_ROUTER_SERIAL for the enrolled router")

    class Pinned(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            actual = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
            if actual != pin:
                raise paramiko.SSHException("Router key mismatch")

    # Relay the SSH stream through the controller; paramiko's ProxyCommand does not work on Windows.
    proc = subprocess.Popen(RELAY, stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=0)
    near, far = socket.socketpair()

    def up():
        try:
            while data := far.recv(65536):
                proc.stdin.write(data)
                proc.stdin.flush()
        except OSError:
            pass

    def down():
        try:
            while data := proc.stdout.read(65536):
                far.sendall(data)
        except OSError:
            pass
        far.close()

    threading.Thread(target=up, daemon=True).start()
    threading.Thread(target=down, daemon=True).start()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(Pinned())
    client.connect(ROUTER, username="admin", password=password, sock=near, look_for_keys=False, allow_agent=False,
                   timeout=20, auth_timeout=20, banner_timeout=20)

    def run(command):
        _, out, err = client.exec_command(command, timeout=60)
        text, error = out.read().decode(errors="replace"), err.read().decode(errors="replace").strip()
        if out.channel.recv_exit_status() or error or re.search(r"^(failure|syntax error|expected )", text, re.M):
            raise SystemExit(f"Router refused: {command[:80]}")
        return text

    run(f':if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "{serial}") '
        'do={ :error "Unexpected router" }')
    return run, lambda: (client.close(), proc.kill())


def main():
    args = sys.argv[1:]
    if len(args) not in (1, 2) or (len(args) == 2 and args[1] != "--apply"):
        raise SystemExit(__doc__)
    run, close = connect(open(args[0], encoding="utf-8").read().strip())
    try:
        if len(args) == 2:
            for command in remove_commands() + install_commands():
                run(command)
            print(run(check()).strip())
        print(run(f'/ip firewall address-list print where list="{LIST}"'))
    finally:
        close()


if __name__ == "__main__":
    main()
