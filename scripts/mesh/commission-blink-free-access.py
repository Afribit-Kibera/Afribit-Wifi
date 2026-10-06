"""Pinned Primary-only Blink core HTTPS allowance; no wallet operation.

Inspect by default. --apply adds only this trial. --remove removes only this
trial's owned rules. Existing Signal, learning and paid-access policies remain.
DNS-resolved destination IPs cannot isolate applications on shared hosting.
"""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOMAINS = ('api.blink.sv', 'ws.blink.sv')
LIST = 'KM-MESH-BLINK-CORE'
PREFIX = 'mesh:blink:core-'
spec = importlib.util.spec_from_file_location('mesh_blink_stage', Path(__file__).with_name('stage-lunanode-controller.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


def inspect(router):
    return stage.router_run(router, '/ip firewall address-list print detail where list="' + LIST + '"; '
        '/ip hotspot walled-garden ip print detail where comment~"^mesh:blink:core-"; '
        '/ip firewall raw print detail where comment~"^mesh:blink:core-"; '
        '/ip firewall filter print detail where comment~"^mesh:blink:core-"; '
        ':put "Signal unchanged:"; /ip firewall filter print count-only where comment~"^mesh:signal:text-"; '
        ':put "Active paid sessions:"; /ip hotspot active print count-only where server="KM-MESH-001"')


def remove(router):
    # Exact owned comments, not a broad regex removal.
    for table, comments in (
        ('/ip firewall raw', ('mesh:blink:core-https',)),
        ('/ip firewall filter', ('mesh:blink:core-out', 'mesh:blink:core-return')),
        ('/ip hotspot walled-garden ip', tuple(PREFIX + domain for domain in DOMAINS)),
    ):
        for comment in comments:
            stage.router_run(router, table + ' remove [find where comment="' + comment + '"]')
    stage.router_run(router, '/ip firewall address-list remove [find where list="' + LIST + '" and comment="mesh:blink:core-host"]')


def apply(router):
    # Reject partial or pre-existing trials rather than silently changing them.
    stage.router_run(router, '{ '
        ':if ([:len [/ip firewall address-list find where list="' + LIST + '"]] > 0 || '
        '[:len [/ip firewall raw find where comment~"^mesh:blink:core-"]] > 0 || '
        '[:len [/ip firewall filter find where comment~"^mesh:blink:core-"]] > 0 || '
        '[:len [/ip hotspot walled-garden ip find where comment~"^mesh:blink:core-"]] > 0) do={ :error "Blink core trial already exists; inspect or remove first" }; '
        ':if ([:len [/ip firewall raw find where comment="kibera-mesh-lab:captive:https-pending-deny"]] != 1 || '
        '[:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:internet-pending-deny"]] != 1 || '
        '[:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:return-deny"]] != 1 || '
        '[:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:private-deny"]] != 1 || '
        '[:len [/ip hotspot find where name="KM-MESH-001"]] != 1 || '
        '[:len [/interface find where name="mesh-customer-30"]] != 1) do={ :error "Expected customer policy missing" } }')
    # Snapshot before mutation, even when this is a retry after a rollback.
    private = ROOT / 'artifacts/mesh-lab/private/blink-free-access' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    private.mkdir(parents=True, exist_ok=False)
    (private / 'router-before.rsc').write_text(stage.router_run(router, '/export terse'), encoding='utf-8')
    try:
        for domain in DOMAINS:
            stage.router_run(router, '/ip firewall address-list add list=' + LIST + ' address="' + domain + '" comment="mesh:blink:core-host"; '
                '/ip hotspot walled-garden ip add server=KM-MESH-001 src-address=10.30.0.0/24 dst-host="' + domain + '" protocol=tcp dst-port=443 action=accept comment="' + PREFIX + domain + '"')
        stage.router_run(router, '/ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address-list=' + LIST + ' protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="mesh:blink:core-https"')
        stage.router_run(router, '/ip firewall filter add chain=KM-MESH-OUT in-interface=mesh-customer-30 out-interface=ether1 src-address=10.30.0.0/24 dst-address-list=' + LIST + ' protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:internet-pending-deny"] comment="mesh:blink:core-out"')
        stage.router_run(router, '/ip firewall filter add chain=KM-MESH-IN in-interface=ether1 dst-address=10.30.0.0/24 src-address-list=' + LIST + ' protocol=tcp src-port=443 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="mesh:blink:core-return"')
        stage.router_run(router, '{ :if ([:len [/ip firewall raw find where comment="mesh:blink:core-https"]] != 1 || '
            '[:len [/ip firewall filter find where comment="mesh:blink:core-out"]] != 1 || '
            '[:len [/ip firewall filter find where comment="mesh:blink:core-return"]] != 1 || '
            '[:len [/ip hotspot walled-garden ip find where comment~"^mesh:blink:core-"]] != 2) do={ :error "Blink scope unconfirmed" } }')
        (private / 'router-after-blink.txt').write_text(inspect(router), encoding='utf-8')
        report = {'router': 'KM-LAB-001', 'domains': DOMAINS, 'source': '10.30.0.0/24', 'port': 'TCP 443 only',
            'applied': True, 'physicalUnpaidAcceptance': 'pending', 'strictApplicationIsolation': False,
            'financialRequestMade': False, 'paidAccessIssued': False, 'signalPolicyChanged': False,
            'sourceCommit': 'e6f92cbe9810fdb5baedf3076f3e749bf25796e3'}
        (private / 'commissioning.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report))
    except Exception:
        # Any successfully added owned items are removed; no pre-existing trial
        # can enter this block because the guard ran before any modification.
        remove(router)
        raise


def main():
    if sys.argv[1:] not in ([], ['--apply'], ['--remove']):
        raise RuntimeError('Use inspect, --apply or --remove')
    router = stage.router_connect(stage.env_values())
    try:
        identity = stage.router_run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
        if identity.splitlines() != ['KM-LAB-001', 'HH70A8H82EG']:
            raise RuntimeError('Unexpected router identity')
        if sys.argv[1:] == ['--apply']:
            apply(router)
        elif sys.argv[1:] == ['--remove']:
            remove(router)
            print('Blink core trial removed; other access policies untouched')
        else:
            print(inspect(router))
    finally:
        router.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else 'Blink trial unconfirmed; inspect private state')
        raise SystemExit(1)
