"""SSH to the dedicated Mesh VM; pin its first-use host key privately.

The initial IP comes from the authenticated LunaNode provisioning response.
Subsequent connections reject a changed host key. No provider passwords used.
"""
import argparse
import json
import ipaddress
import socket
import sys
import time
from pathlib import Path

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/lunanode"


def connect(source_address=None):
    state = json.loads((PRIVATE / "server.json").read_text())
    if state["hostname"] != "mesh-core.afribit.africa" or state["status"] != "active":
        raise RuntimeError("Dedicated Mesh VM is not confirmed active")
    known = PRIVATE / "known_hosts"
    client = paramiko.SSHClient()
    if known.exists():
        client.load_host_keys(str(known))
        client.set_missing_host_key_policy(paramiko.RejectPolicy())
    else:
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key = paramiko.Ed25519Key.from_private_key_file(str(PRIVATE / "mesh_lunanode_ed25519"))
    # The lab Ethernet and home Wi-Fi are separate paths. Allow an explicit
    # local source without weakening the existing server host-key pin.
    sock = None
    if source_address is not None:
        source_address = str(ipaddress.IPv4Address(source_address))
        sock = socket.create_connection((state["public_ip"], 22), timeout=12,
                                        source_address=(source_address, 0))
    try:
        client.connect(state["public_ip"], username="ubuntu", pkey=key, look_for_keys=False,
                       allow_agent=False, timeout=12, auth_timeout=12, banner_timeout=12, sock=sock)
    except Exception:
        client.close()
        if sock is not None:
            sock.close()
        raise
    if not known.exists():
        client.save_host_keys(str(known))
    return client


def execute(client, command, timeout=600):
    _, stdout, stderr = client.exec_command(command, timeout=timeout)
    out, error = stdout.read().decode(errors="replace"), stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    return code, out, error


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--command")
    parser.add_argument("--upload", nargs=2, metavar=("LOCAL", "REMOTE"))
    parser.add_argument("--source-address", help="Optional local home-network IPv4 source")
    args = parser.parse_args()
    client = connect(args.source_address)
    try:
        if args.upload:
            with client.open_sftp() as sftp:
                sftp.put(args.upload[0], args.upload[1])
            print("Upload complete")
        if args.command:
            code, out, error = execute(client, args.command)
            print(out, end="")
            print(error, end="")
            raise SystemExit(code)
    finally:
        client.close()
