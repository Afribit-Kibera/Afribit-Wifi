"""Provision one dedicated Mesh pilot VM using the existing LunaNode client.

Default inspection is read-only. Private state prevents blind retries after an
ambiguous VM-create response. This never modifies existing Insats instances.
"""
import argparse
import importlib.util
import ipaddress
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/lunanode"
HOSTNAME = "mesh-core.afribit.africa"
CLIENT = Path(r"G:\My Drive\workspaces\insats\ops\lunanode\lunanode_api.py")


def client():
    spec = importlib.util.spec_from_file_location("lunanode_client", CLIENT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def call(api, category, action, values=None):
    result = api.api_call(category, action, values or {})
    if result.get("success") != "yes":
        raise RuntimeError(f"LunaNode {category}/{action} was not confirmed")
    return result


def save(name, value):
    PRIVATE.mkdir(parents=True, exist_ok=True)
    (PRIVATE / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def inspect(api):
    plans = call(api, "plan", "list")["plans"]
    vms = call(api, "vm", "list")["vms"]
    return {
        "plan": next(p for p in plans if p["name"] == "m.1s"),
        "existing": [{k: v.get(k) for k in ("vm_id", "hostname", "plan_id", "primaryip")}
                     for v in vms if v.get("hostname") == HOSTNAME],
    }


def provision(api):
    snapshot = inspect(api)
    state_path = PRIVATE / "server.json"
    if snapshot["existing"]:
        if not state_path.exists():
            raise RuntimeError("Matching VM already exists; inspect ownership before proceeding")
        state = json.loads(state_path.read_text())
        if state["vm_id"] != snapshot["existing"][0]["vm_id"]:
            raise RuntimeError("VM ownership differs from private commissioning record")
        return info(api, state)
    if (PRIVATE / "create-intent.json").exists():
        raise RuntimeError("A prior create attempt requires reconciliation; no automatic duplicate")
    plan = snapshot["plan"]
    if plan["ram"] != "1024" or plan["storage"] != "15" or plan["price_monthly_nice"] != "$3.5":
        raise RuntimeError("The requested entry plan changed; inspect current price/specification")
    images = call(api, "image", "list", {"region": "toronto"})["images"]
    image = next(i for i in images if i["name"] == "Ubuntu 24.04 64-bit (template)" and i["status"] == "active")
    operator_ip = str(ipaddress.IPv4Address(urllib.request.urlopen("https://api.ipify.org", timeout=15).read().decode()))
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    PRIVATE.mkdir(parents=True, exist_ok=True)
    key_path = PRIVATE / "mesh_lunanode_ed25519"
    if not key_path.exists():
        key = Ed25519PrivateKey.generate()
        key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.OpenSSH,
                                               serialization.NoEncryption()))
        key_path.with_suffix(".pub").write_bytes(key.public_key().public_bytes(serialization.Encoding.OpenSSH,
                                                                             serialization.PublicFormat.OpenSSH) + b" mesh-core-pilot\n")
    key_result = call(api, "sshkey", "add", {"label": "mesh-core-pilot", "sshkey": key_path.with_suffix(".pub").read_text().strip()})
    key_id = str(key_result["key_id"])
    group_id = str(call(api, "securitygroup", "create", {"region": "toronto", "name": "mesh-core-pilot"})["group_id"])
    for protocol, port, source, label in [("tcp", 22, operator_ip + "/32", "operator-ssh"),
                                          ("tcp", 80, "0.0.0.0/0", "http-acme"),
                                          ("tcp", 443, "0.0.0.0/0", "https"),
                                          ("udp", 51820, "0.0.0.0/0", "wireguard")]:
        call(api, "securitygroup", "rule-insert", {"region": "toronto", "group_id": group_id,
             "direction": "ingress", "type": "4", "protocol": protocol, "remote_type": "cidr",
             "remote_value": source, "port_min": str(port), "port_max": str(port), "label": label})
    state = {"hostname": HOSTNAME, "plan_id": plan["plan_id"], "plan": plan["name"],
             "image_id": image["image_id"], "region": "toronto", "key_id": key_id,
             "group_id": group_id, "operator_ip": operator_ip, "monthly_usd": 3.5}
    save("create-intent.json", state)
    result = call(api, "vm", "create", {"hostname": HOSTNAME, "plan_id": state["plan_id"],
                  "image_id": state["image_id"], "region": "toronto", "key_id": key_id,
                  "securitygroups": group_id})
    state["vm_id"] = result["vm_id"]
    save("server.json", state)
    return info(api, state)


def info(api, state):
    result = call(api, "vm", "info", {"vm_id": state["vm_id"]})
    # The provider response includes a generated login password. Never retain or print it.
    details = result.get("info", {})
    state["public_ip"] = details.get("ip") or result.get("extra", {}).get("primaryip")
    state["status"] = details.get("status_raw")
    save("server.json", state)
    return state


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["inspect", "provision", "info"], default="inspect", nargs="?")
    args = parser.parse_args()
    api = client()
    try:
        result = inspect(api) if args.action == "inspect" else provision(api) if args.action == "provision" else info(api, json.loads((PRIVATE / "server.json").read_text()))
        print(json.dumps(result, indent=2))
    except Exception as exc:
        print(f"Commissioning stopped: {type(exc).__name__}: {exc}" if isinstance(exc, RuntimeError) else f"Commissioning stopped: {type(exc).__name__}; inspect private state before retrying")
        raise SystemExit(1)
