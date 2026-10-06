"""Read-only, pinned-router push diagnostics. No packet contents or wallet requests.

Only aggregate connection counts for the specified guest phone (or guest subnet),
push DNS cache counts and firewall counters are saved. This never adds an allowance.
"""
import argparse
import importlib.util
import ipaddress
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    'mesh_push_stage', Path(__file__).with_name('stage-lunanode-controller.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)

PUSH_HOSTS = ('mtalk.google.com', 'mtalk4.google.com',
              *(f'alt{number}-mtalk.google.com' for number in range(1, 9)),
              'firebaseinstallations.googleapis.com', 'android.apis.google.com')


def inspect(router, phone=None):
    source_filter = 'src-address~"^10[.]30[.]0[.]"'
    if phone:
        address = ipaddress.IPv4Address(phone)
        if address not in ipaddress.IPv4Network('10.30.0.0/24') or address.packed[-1] in (0, 1, 255):
            raise RuntimeError('Specify a Mesh guest phone IPv4 address')
        source_filter = f'src-address="{address}"'
    commands = [':put ("tcpEstablishedTimeout=" . [/ip firewall connection tracking get tcp-established-timeout])',
                ':put ("paidGuestSessions=" . [/ip hotspot active print count-only where server="KM-MESH-001"])']
    for port in (5223, 5228, 5229, 5230):
        for state in ('established', 'syn-sent', 'close', 'close-wait'):
            commands.append(f':put ("tcp{port}.{state}=" . [/ip firewall connection print count-only '
                            f'where protocol=tcp and {source_filter} '
                            f'and dst-port={port} and tcp-state="{state}"])')
    for host in PUSH_HOSTS:
        commands.append(f':put ("cached.{host}=" . [:len [/ip dns cache find where name="{host}"]])')
    for table, comment in (('/ip firewall raw', 'kibera-mesh-lab:captive:https-pending-deny'),
                           ('/ip firewall filter', 'kibera-mesh-lab:captive:internet-pending-deny')):
        commands.append(f':foreach rule in=[{table} find where comment="{comment}"] do={{ '
                        f':put ("{comment}.packets=" . [{table} get $rule packets]) }}')
    values = {}
    # RouterOS SSH exec has a small command buffer. Keep each read below it.
    for offset in range(0, len(commands), 4):
        output = stage.router_run(router, '; '.join(commands[offset:offset + 4]))
        for line in output.splitlines():
            if line.isdigit():
                # print count-only emits the number as well as returning it.
                continue
            if '=' not in line:
                raise RuntimeError('Unexpected push inspection result')
            key, value = line.split('=', 1)
            values[key] = int(value) if value.isdigit() else value
    return {'checkedAt': datetime.now(timezone.utc).isoformat(), 'router': 'KM-LAB-001',
            'scope': phone or '10.30.0.0/24', 'readOnly': True,
            'notificationDeliveryVerified': False, 'observations': values}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phone')
    args = parser.parse_args()
    # Validate input before connecting or sending any router command.
    if args.phone:
        address = ipaddress.IPv4Address(args.phone)
        if address not in ipaddress.IPv4Network('10.30.0.0/24') or address.packed[-1] in (0, 1, 255):
            raise RuntimeError('Specify a Mesh guest phone IPv4 address')
    router = stage.router_connect(stage.env_values())
    try:
        identity = stage.router_run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
        if identity.splitlines() != ['KM-LAB-001', 'HH70A8H82EG']:
            raise RuntimeError('Unexpected router identity')
        report = inspect(router, args.phone)
        target = ROOT / 'artifacts/mesh-lab/private/push-diagnostics'
        target.mkdir(parents=True, exist_ok=True)
        (target / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.json')).write_text(
            json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report, indent=2))
    finally:
        router.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, (RuntimeError, ipaddress.AddressValueError))
              else 'Push inspection failed; no router policy was changed')
        raise SystemExit(1)
